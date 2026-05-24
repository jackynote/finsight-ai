import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ChatGateway } from './chat.gateway';
import { AiModule } from '../ai/ai.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { AssetsModule } from '../assets/assets.module';
import { ChatHistory } from './entities/chat-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatHistory]),
    AuthModule,
    AiModule,
    TransactionsModule,
    AssetsModule,
  ],
  providers: [ChatGateway],
})
export class ChatModule {}
