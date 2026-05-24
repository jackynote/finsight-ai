import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AiService } from './ai.service';
import { TransactionsService } from '../transactions/transactions.service';
import { AssetsService } from '../assets/assets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly transactionsService: TransactionsService,
    private readonly assetsService: AssetsService,
  ) {}

  @Get('insights')
  async getInsights(@Request() req) {
    const userId = req.user.id;
    const [transactions, assets] = await Promise.all([
      this.transactionsService.findAll(userId),
      this.assetsService.findAll(userId),
    ]);

    return this.aiService.generateInsights(transactions, assets);
  }
}
