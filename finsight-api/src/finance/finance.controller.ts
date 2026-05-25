import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('totals')
  getTotals(@Request() req: any) {
    const userId = req.user.id;
    return this.financeService.getTotals(userId);
  }

  @Get('dashboard')
  getDashboardData(@Request() req: any) {
    const userId = req.user.id;
    return this.financeService.getDashboardData(userId);
  }
}
