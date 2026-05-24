import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ChatGateway } from './chat.gateway';
import { AiModule } from '../ai/ai.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { AssetsModule } from '../assets/assets.module';
import { ChatHistory } from './entities/chat-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatHistory]),
    JwtModule,
    AiModule,
    TransactionsModule,
    AssetsModule,
  ],
  providers: [ChatGateway],
})
export class ChatModule {}
