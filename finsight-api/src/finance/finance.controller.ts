import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { DashboardPeriod } from './finance.service';
import type { RequestWithUser } from '../auth/types/auth.types';

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('totals')
  getTotals(@Request() req: RequestWithUser) {
    const userId = req.user.id;
    return this.financeService.getTotals(userId);
  }

  @Get('assets')
  getGroupedAssets(@Request() req: RequestWithUser) {
    const userId = req.user.id;
    return this.financeService.getGroupedAssets(userId);
  }

  @Get('dashboard')
  getDashboardData(@Request() req: RequestWithUser, @Query('period') period: DashboardPeriod = '30') {
    const userId = req.user.id;
    return this.financeService.getDashboardData(userId, period);
  }
}
