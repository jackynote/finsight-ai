import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Currency } from './entities/currency.entity';
import { CurrencyRate } from './entities/currency-rate.entity';
import { UpdateRateDto } from './dto/update-rate.dto';
import { AssetCategory } from '../common/enums/asset-category.enum';

@Injectable()
export class CurrenciesService implements OnModuleInit {
  constructor(
    @InjectRepository(Currency)
    private readonly currencyRepository: Repository<Currency>,
    @InjectRepository(CurrencyRate)
    private readonly rateRepository: Repository<CurrencyRate>,
  ) {}

  async onModuleInit() {
    await this.seedCurrencies();
  }

  private async seedCurrencies() {
    const count = await this.currencyRepository.count();
    if (count > 0) return;

    const initialCurrencies = [
      {
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        type: AssetCategory.FIAT,
        initialRate: { pair: 'USDUSD', ratio: 1 },
      },
      {
        code: 'VND',
        name: 'Vietnamese Dong',
        symbol: '₫',
        type: AssetCategory.FIAT,
        initialRate: { pair: 'USDVND', ratio: 26200 },
      },
      {
        code: 'BTC',
        name: 'Bitcoin',
        symbol: '₿',
        type: AssetCategory.CRYPTO,
        initialRate: { pair: 'BTCUSD', ratio: 65000 },
      },
      {
        code: 'ETH',
        name: 'Ethereum',
        symbol: 'Ξ',
        type: AssetCategory.CRYPTO,
        initialRate: { pair: 'ETHUSD', ratio: 3500 },
      },
      {
        code: 'GOLD',
        name: 'Gold',
        symbol: 'Au',
        type: AssetCategory.GOLD,
        initialRate: { pair: 'GOLDUSD', ratio: 2300 },
      },
    ];

    for (const data of initialCurrencies) {
      const { initialRate, ...currencyData } = data;
      const currency = await this.create(currencyData);
      await this.updateRate(currency.code, initialRate);
    }
  }

  async findAll() {
    return this.currencyRepository.find({
      relations: { rates: true },
      order: { code: 'ASC' },
    });
  }

  async findByCode(code: string) {
    const currency = await this.currencyRepository.findOne({
      where: { code: code.toUpperCase() },
      relations: { rates: true },
    });

    if (!currency) {
      throw new NotFoundException(`Currency with code ${code} not found`);
    }

    return currency;
  }

  async updateRate(code: string, updateRateDto: UpdateRateDto) {
    const currency = await this.findByCode(code);
    const normalizedCode = currency.code.toUpperCase();

    // In a production system, we might want to keep history.
    // For now, we update the existing rate or create a new one.
    let rate = await this.rateRepository.findOne({
      where: { currency_id: currency.id },
    });

    const pair =
      updateRateDto.pair?.trim().toUpperCase() ||
      rate?.pair ||
      `${normalizedCode}USD`;
    const platform =
      updateRateDto.platform === undefined
        ? (rate?.platform ?? null)
        : updateRateDto.platform;
    const isAutoUpdate =
      updateRateDto.is_auto_update ?? rate?.is_auto_update ?? false;

    if (rate) {
      rate.pair = pair;
      rate.ratio = updateRateDto.ratio;
      rate.is_auto_update = isAutoUpdate;
      rate.platform = platform;
    } else {
      rate = this.rateRepository.create({
        currency_id: currency.id,
        pair,
        ratio: updateRateDto.ratio,
        is_auto_update: isAutoUpdate,
        platform,
      });
    }

    return this.rateRepository.save(rate);
  }

  // Helper for seeding
  async create(data: Partial<Currency>) {
    const currency = this.currencyRepository.create(data);
    return this.currencyRepository.save(currency);
  }
}
