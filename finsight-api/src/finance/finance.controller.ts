
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('totals')
  getTotals(@Request() req) {
    return this.financeService.getTotals(req.user.id);
  }
}
