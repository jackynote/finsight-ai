import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AiService } from '../ai/ai.service';
import { TransactionsService } from '../transactions/transactions.service';
import { AssetsService } from '../assets/assets.service';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatHistory } from './entities/chat-history.entity';
import { Repository } from 'typeorm';
import { JwtPayload } from '../auth/types/auth.types';
import type { CreateTransactionDto } from '../transactions/dto/create-transaction.dto';

interface AuthenticatedSocket extends Socket {
  data: {
    user: JwtPayload;
  };
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly aiService: AiService,
    private readonly transactionsService: TransactionsService,
    private readonly assetsService: AssetsService,
    @InjectRepository(ChatHistory)
    private readonly chatHistoryRepository: Repository<ChatHistory>,
  ) {}

  handleConnection(client: Socket) {
    try {
      const token = typeof client.handshake.auth.token === 'string' ? client.handshake.auth.token : '';
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify<JwtPayload>(token);
      if (!payload?.sub) {
        throw new UnauthorizedException();
      }
      (client as AuthenticatedSocket).data.user = payload;
      this.logger.log(`Client connected: ${client.id}`);
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('getChatHistory')
  async handleGetHistory(@MessageBody() data: { offset?: number } = {}, @ConnectedSocket() client: AuthenticatedSocket) {
    const userId = client.data.user.sub;
    const offset = data?.offset || 0;
    const pageSize = 50;

    // Get total count for pagination info
    const total = await this.chatHistoryRepository.count({
      where: { user_id: userId },
    });

    // Calculate skip so that when offset=0 we return the latest `pageSize` messages.
    // Subsequent requests use `offset` as the number of messages already loaded,
    // so we fetch the previous page by moving the window backwards from the end.
    const skip = Math.max(0, total - pageSize - offset);

    const history = await this.chatHistoryRepository.find({
      where: { user_id: userId },
      order: { created_at: 'ASC' },
      skip,
      take: pageSize,
    });

    client.emit('chatHistory', {
      messages: history,
      total,
      hasMore: offset + pageSize < total,
    });
  }

  @SubscribeMessage('getOlderMessages')
  async handleGetOlderMessages(@MessageBody() data: { offset: number }, @ConnectedSocket() client: AuthenticatedSocket) {
    const userId = client.data.user.sub;
    const offset = data.offset;
    const pageSize = 50;

    // We need total to calculate the correct window for older messages as above.
    const total = await this.chatHistoryRepository.count({
      where: { user_id: userId },
    });
    const skip = Math.max(0, total - pageSize - offset);

    const history = await this.chatHistoryRepository.find({
      where: { user_id: userId },
      order: { created_at: 'ASC' },
      skip,
      take: pageSize,
    });

    client.emit('olderMessages', {
      messages: history,
      hasMore: offset + pageSize < total,
    });
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() data: { message: string }, @ConnectedSocket() client: AuthenticatedSocket) {
    const userId = client.data.user.sub;
    const userMessage = data.message;

    // Save user message
    await this.chatHistoryRepository.save({
      user_id: userId,
      role: 'user',
      content: userMessage,
    });

    // Notify typing
    client.emit('isTyping', true);

    try {
      // Get context: transactions, assets, and recent conversation history (15 minutes)
      const [transactions, assets, recentHistory] = await Promise.all([
        this.transactionsService.findAll(userId),
        this.assetsService.findAll(userId),
        this.getRecentConversationHistory(userId, 15), // 15 minutes
      ]);

      const aiResponse = await this.aiService.processMessage(userMessage, {
        transactions,
        assets,
        conversationHistory: recentHistory,
      });

      // Handle AI Actions
      let actionResult: unknown = null;
      if (aiResponse.action.type === 'ADD_TRANSACTION') {
        const actionData = (aiResponse.action.data ?? {}) as Partial<CreateTransactionDto> & { category?: string };
        const normalizedActionData: CreateTransactionDto = {
          amount: Number(actionData.amount ?? 0),
          type: actionData.type === 'income' ? 'income' : 'expense',
          description: actionData.description,
          date: actionData.date,
          category: actionData.category,
          currency_id: actionData.currency_id,
          category_code: actionData.category_code ?? actionData.category,
        };
        actionResult = await this.transactionsService.create(normalizedActionData, userId);
      } else if (aiResponse.action.type === 'SHOW_TRANSACTIONS') {
        const query = this.normalizeShowTransactionsActionData(aiResponse.action.data);
        const result = await this.transactionsService.findForAssistant(userId, query);
        actionResult = result;
        aiResponse.content = this.formatTransactionListResponse(result);
      }

      // Save assistant message
      await this.chatHistoryRepository.save({
        user_id: userId,
        role: 'assistant',
        content: aiResponse.content,
        action_type: aiResponse.action.type,
        action_data: aiResponse.action.data,
      });

      // Send response
      client.emit('messageResponse', {
        content: aiResponse.content,
        action: aiResponse.action,
        actionResult,
      });
    } catch (error: unknown) {
      this.logger.error('Chat error', error instanceof Error ? error.stack : undefined);
      client.emit('messageResponse', {
        content: 'Sorry, something went wrong in my financial circuits.',
        action: { type: 'NONE' },
      });
    } finally {
      client.emit('isTyping', false);
    }
  }

  private async getRecentConversationHistory(userId: string, minutesBack: number) {
    const timeAgo = new Date(Date.now() - minutesBack * 60 * 1000);

    const history = await this.chatHistoryRepository
      .createQueryBuilder('chat')
      .where('chat.user_id = :userId', { userId })
      .andWhere('chat.created_at >= :timeAgo', { timeAgo })
      .orderBy('chat.created_at', 'ASC')
      .getMany();

    // Format as conversation with role and content
    return history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  private normalizeShowTransactionsActionData(data?: Record<string, unknown>) {
    const asString = (value: unknown) => (typeof value === 'string' ? value.slice(0, 10) : undefined);
    const asType = (value: unknown): 'income' | 'expense' | undefined => (value === 'income' || value === 'expense' ? value : undefined);
    const asLimit = (value: unknown) => {
      if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
      return Math.min(Math.max(Math.floor(value), 1), 50);
    };

    return {
      startDate: asString(data?.startDate),
      endDate: asString(data?.endDate),
      type: asType(data?.type),
      category_code: typeof data?.category_code === 'string' ? data.category_code : undefined,
      limit: asLimit(data?.limit),
    };
  }

  private formatTransactionListResponse(result: Awaited<ReturnType<TransactionsService['findForAssistant']>>) {
    const { transactions, total, summary, appliedFilters } = result;
    const headerParts = [`Found ${transactions.length} transaction${transactions.length === 1 ? '' : 's'}`];

    if (appliedFilters.startDate || appliedFilters.endDate) {
      headerParts.push([appliedFilters.startDate ?? 'earliest', appliedFilters.endDate ?? 'latest'].join(' to '));
    }

    const lines: string[] = [];
    if (transactions.length === 0) {
      lines.push('No matching transactions were found.');
    } else {
      lines.push(`Income: ${summary.income.toFixed(2)} | Expense: ${summary.expense.toFixed(2)} | Net: ${summary.net.toFixed(2)}`);
      lines.push('');
      for (const transaction of transactions) {
        lines.push(this.formatTransactionLine(transaction));
      }
      if (total > transactions.length) {
        lines.push('');
        lines.push(`Showing ${transactions.length} of ${total} matching transactions.`);
      }
    }

    return [headerParts.join(' - '), ...lines].join('\n');
  }

  private formatTransactionLine(transaction: Awaited<ReturnType<TransactionsService['findAll']>>[number]) {
    const date = this.formatTransactionDate(transaction.date);
    const amount = this.formatCurrencyAmount(transaction.amount, transaction.currency?.symbol, transaction.currency?.code);
    const category = transaction.category?.value || transaction.category_code || 'Uncategorized';
    const description = transaction.description ? ` - ${transaction.description}` : '';
    return `- ${date} | ${transaction.type} | ${amount} | ${category}${description}`;
  }

  private formatTransactionDate(value: Date | string) {
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }
    return String(value).slice(0, 10);
  }

  private formatCurrencyAmount(amount: unknown, symbol?: string | null, code?: string | null) {
    const numericAmount = Number(amount) || 0;
    if (symbol) {
      return `${symbol}${numericAmount.toFixed(2)}`;
    }
    if (code) {
      return `${numericAmount.toFixed(2)} ${code}`;
    }
    return numericAmount.toFixed(2);
  }
}
