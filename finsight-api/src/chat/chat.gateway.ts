import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AiService } from '../ai/ai.service';
import { TransactionsService } from '../transactions/transactions.service';
import { AssetsService } from '../assets/assets.service';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatHistory } from './entities/chat-history.entity';
import { Repository } from 'typeorm';

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

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }
      client.data.user = this.jwtService.verify(token);
      this.logger.log(`Client connected: ${client.id}`);
    } catch (e) {
      client.disconnect();
    }
  }

  @SubscribeMessage('getChatHistory')
  async handleGetHistory(
    @MessageBody() data: { offset?: number } = {},
    @ConnectedSocket() client: Socket,
  ) {
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
  async handleGetOlderMessages(
    @MessageBody() data: { offset: number },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.user.sub;
    const offset = data.offset;
    const pageSize = 50;

    // We need total to calculate the correct window for older messages as above.
    const total = await this.chatHistoryRepository.count({ where: { user_id: userId } });
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
  async handleMessage(
    @MessageBody() data: { message: string },
    @ConnectedSocket() client: Socket,
  ) {
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
        transactions: transactions.slice(0, 5),
        assets,
        conversationHistory: recentHistory,
      });

      // Handle AI Actions
      let actionResult: any = null;
      if (aiResponse.action.type === 'ADD_TRANSACTION') {
        const normalizedActionData = {
          ...aiResponse.action.data,
          category_code:
            aiResponse.action.data?.category_code ??
            aiResponse.action.data?.category,
        };
        actionResult = await this.transactionsService.create(
          normalizedActionData,
          userId,
        );
      } else if (aiResponse.action.type === 'UPDATE_ASSET') {
        const asset = assets.find((a) =>
          a.name
            .toLowerCase()
            .includes(aiResponse.action.data.name.toLowerCase()),
        );
        if (asset) {
          actionResult = await this.assetsService.update(
            asset.id,
            { current_price: aiResponse.action.data.current_price },
            userId,
          );
        }
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
    } catch (error) {
      this.logger.error('Chat error', error.stack);
      client.emit('messageResponse', {
        content: 'Sorry, something went wrong in my financial circuits.',
        action: { type: 'NONE' },
      });
    } finally {
      client.emit('isTyping', false);
    }
  }

  private async getRecentConversationHistory(
    userId: string,
    minutesBack: number,
  ) {
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
}
