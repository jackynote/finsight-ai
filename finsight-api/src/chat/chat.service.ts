import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatHistory } from './entities/chat-history.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatHistory)
    private readonly chatHistoryRepository: Repository<ChatHistory>,
  ) {}

  async getHistory(userId: string, offset = 0) {
    const pageSize = 50;
    const safeOffset = Number.isFinite(offset) && offset > 0 ? Math.floor(offset) : 0;

    const total = await this.chatHistoryRepository.count({
      where: { user_id: userId },
    });

    const skip = Math.max(0, total - pageSize - safeOffset);

    const history = await this.chatHistoryRepository.find({
      where: { user_id: userId },
      order: { created_at: 'ASC' },
      skip,
      take: pageSize,
    });

    return {
      messages: history,
      total,
      hasMore: skip > 0,
      nextOffset: safeOffset + pageSize,
    };
  }
}
