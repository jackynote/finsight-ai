import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Currency } from './entities/currency.entity';
import { CurrencyRate } from './entities/currency-rate.entity';
import { CurrenciesService } from './currencies.service';
import { CurrenciesController } from './currencies.controller';
import { CoinGeckoRateSyncService } from './coingecko-rate-sync.service';

@Module({
  imports: [TypeOrmModule.forFeature([Currency, CurrencyRate])],
  controllers: [CurrenciesController],
  providers: [CurrenciesService, CoinGeckoRateSyncService],
  exports: [CurrenciesService],
})
export class CurrenciesModule {}
