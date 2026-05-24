import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
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
      const payload = this.jwtService.verify(token);
      client.data.user = payload;
      this.logger.log(`Client connected: ${client.id}`);
    } catch (e) {
      client.disconnect();
    }
  }

  @SubscribeMessage('getChatHistory')
  async handleGetHistory(@ConnectedSocket() client: Socket) {
    const userId = client.data.user.sub;
    const history = await this.chatHistoryRepository.find({
      where: { user_id: userId },
      order: { created_at: 'ASC' },
      take: 50,
    });
    client.emit('chatHistory', history);
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
      // Get context
      const [transactions, assets] = await Promise.all([
        this.transactionsService.findAll(userId),
        this.assetsService.findAll(userId),
      ]);

      const aiResponse = await this.aiService.processMessage(userMessage, {
        transactions: transactions.slice(0, 5),
        assets,
      });

      // Handle AI Actions
      let actionResult: any = null;
      if (aiResponse.action.type === 'ADD_TRANSACTION') {
        actionResult = await this.transactionsService.create(
          aiResponse.action.data,
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
}
