import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AIInsight } from './entities/ai-insight.entity';
import { TransactionsModule } from '../transactions/transactions.module';
import { AssetsModule } from '../assets/assets.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AIInsight]),
    TransactionsModule,
    AssetsModule,
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
