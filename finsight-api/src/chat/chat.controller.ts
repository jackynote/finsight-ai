import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatHistoryQueryDto } from './dto/chat-history-query.dto';
import { ChatService } from './chat.service';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('history')
  getHistory(@Req() req: Request, @Query() query: ChatHistoryQueryDto) {
    const userId = (req.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return { messages: [], total: 0, hasMore: false };
    }

    return this.chatService.getHistory(userId, query.offset ?? 0);
  }
}
