import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatHistoryQueryDto } from './dto/chat-history-query.dto';
import { ChatService } from './chat.service';
import type { RequestWithUser } from '../auth/types/auth.types';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('history')
  getHistory(@Req() req: RequestWithUser, @Query() query: ChatHistoryQueryDto) {
    const userId = req.user.id;
    return this.chatService.getHistory(userId, query.offset ?? 0);
  }
}
