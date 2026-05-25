import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AiService } from './ai.service';
import { TransactionsService } from '../transactions/transactions.service';
import { AssetsService } from '../assets/assets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface RequestWithUser extends Request {
  user: {
    id: string;
  };
}

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly transactionsService: TransactionsService,
    private readonly assetsService: AssetsService,
  ) {}

  @Get('insights')
  async getInsights(@Request() req: RequestWithUser): Promise<any> {
    const userId = req.user.id;

    // First check if we have cached insights
    const cached = await this.aiService.findAllByUserId(userId);

    // If we have insights and they are fresh (less than 1h), return them
    if (cached.length > 0) {
      const isFresh =
        new Date().getTime() - new Date(cached[0].created_at).getTime() <
        1 * 60 * 60 * 1000;
      if (isFresh) {
        return { insights: cached };
      }
    }

    // Otherwise, generate new ones
    const [transactions, assets] = await Promise.all([
      this.transactionsService.findAll(userId),
      this.assetsService.findAll(userId),
    ]);

    return this.aiService.generateAndSaveInsights(userId, transactions, assets);
  }
}
