import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AIInsight } from './entities/ai-insight.entity';
import { TransactionsModule } from '../transactions/transactions.module';
import { AssetsModule } from '../assets/assets.module';
import { TransactionCategoriesModule } from '../transaction-categories/transaction-categories.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AIInsight]),
    TransactionsModule,
    AssetsModule,
    TransactionCategoriesModule,
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
