import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { TransactionsModule } from '../transactions/transactions.module';
import { AssetsModule } from '../assets/assets.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [TransactionsModule, AssetsModule, AiModule],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
