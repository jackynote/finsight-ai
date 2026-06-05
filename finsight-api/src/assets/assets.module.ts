import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { Asset } from './entities/asset.entity';
import { CurrenciesModule } from '../currencies/currencies.module';
import { User } from '../auth/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Asset, User]), CurrenciesModule],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
