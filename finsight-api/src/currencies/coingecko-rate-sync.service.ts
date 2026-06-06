import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrencyRate } from './entities/currency-rate.entity';
import { CurrenciesService } from './currencies.service';
import { RatePlatform } from './enums/rate-platform.enum';

interface CoinGeckoPriceResponse {
  [coinId: string]: Record<string, number>;
}

// const AUTO_SYNC_INTERVAL_MS = 5 * 60 * 1000;
const AUTO_SYNC_INTERVAL_MS = 1 * 60 * 1000;
const COINGECKO_PLATFORM = RatePlatform.COINGECKO;

@Injectable()
export class CoinGeckoRateSyncService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(CoinGeckoRateSyncService.name);
  private syncTimer?: NodeJS.Timeout;

  constructor(
    private readonly configService: ConfigService,
    private readonly currenciesService: CurrenciesService,
    @InjectRepository(CurrencyRate)
    private readonly rateRepository: Repository<CurrencyRate>,
  ) {}

  async onApplicationBootstrap() {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      this.logger.warn(
        'COINGECKO_API_KEY is not defined; automatic currency sync is disabled',
      );
      return;
    }

    try {
      await this.syncAutoUpdateRates();
    } catch (error) {
      this.logger.error(
        'Initial CoinGecko sync failed',
        this.stringifyError(error),
      );
    }

    this.syncTimer = setInterval(() => {
      void this.syncAutoUpdateRates().catch((error: unknown) => {
        this.logger.error(
          'Scheduled CoinGecko sync failed',
          this.stringifyError(error),
        );
      });
    }, AUTO_SYNC_INTERVAL_MS);
    this.syncTimer.unref?.();
  }

  onModuleDestroy() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }
  }

  private getBaseUrl() {
    return (
      this.configService.get<string>('COINGECKO_API_URL') ??
      'https://api.coingecko.com/api/v3'
    );
  }

  private getApiKey() {
    return this.configService.get<string>('COINGECKO_API_KEY')?.trim();
  }

  private getApiKeyHeaderName() {
    return (
      this.configService.get<string>('COINGECKO_API_KEY_HEADER')?.trim() ??
      'x-cg-demo-api-key'
    );
  }

  private stringifyError(error: unknown) {
    if (error instanceof Error) {
      return error.stack ?? error.message;
    }

    return String(error);
  }

  async syncAutoUpdateRates() {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return;
    }

    const autoUpdateRates = await this.currenciesService.findAutoUpdateRates(
      COINGECKO_PLATFORM,
    );

    const ratesToSync = autoUpdateRates
      .map((rate) => {
        const coinGeckoId = rate.coingecko_id?.trim();
        const vsCurrency = rate.quote_currency_code.trim().toLowerCase();
        if (!coinGeckoId || !vsCurrency) {
          return null;
        }

        return {
          rate,
          coinGeckoId,
          vsCurrency,
        };
      })
      .filter(
        (
          item,
        ): item is {
          rate: CurrencyRate;
          coinGeckoId: string;
          vsCurrency: string;
        } => Boolean(item),
      );

    if (ratesToSync.length === 0) {
      this.logger.debug('No CoinGecko-backed currency rates need syncing');
      return;
    }

    const ids = Array.from(new Set(ratesToSync.map((item) => item.coinGeckoId)));
    const vsCurrencies = Array.from(
      new Set(ratesToSync.map((item) => item.vsCurrency)),
    );

    const url = new URL(
      'simple/price',
      `${this.getBaseUrl().replace(/\/$/, '')}/`,
    );
    url.searchParams.set('ids', ids.join(','));
    url.searchParams.set('vs_currencies', vsCurrencies.join(','));

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        [this.getApiKeyHeaderName()]: apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `CoinGecko sync failed: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const priceMap = (await response.json()) as CoinGeckoPriceResponse;
    const updates: CurrencyRate[] = [];

    for (const item of ratesToSync) {
      const price = priceMap[item.coinGeckoId]?.[item.vsCurrency];
      if (!Number.isFinite(price) || price <= 0) {
        this.logger.warn(
          `CoinGecko returned no valid price for ${item.rate.pair} (${item.coinGeckoId}/${item.vsCurrency})`,
        );
        continue;
      }

      item.rate.ratio = price;
      item.rate.is_auto_update = true;
      item.rate.platform = COINGECKO_PLATFORM;
      updates.push(item.rate);
    }

    if (updates.length === 0) {
      this.logger.warn('CoinGecko sync completed, but no rows were updated');
      return;
    }

    await this.rateRepository.save(updates);
    this.logger.log(
      `Synced ${updates.length}/${ratesToSync.length} CoinGecko currency rates`,
    );
  }
}
