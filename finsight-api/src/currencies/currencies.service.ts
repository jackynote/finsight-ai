import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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
      await this.create(currencyData);
      await this.upsertRateByPair(initialRate.pair, initialRate);
    }
  }

  async findAll() {
    const currencies = await this.currencyRepository.find({
      order: { code: 'ASC' },
    });
    return this.attachRates(currencies);
  }

  async findByCode(code: string) {
    const currency = await this.currencyRepository.findOne({
      where: { code: code.toUpperCase() },
    });

    if (!currency) {
      throw new NotFoundException(`Currency with code ${code} not found`);
    }

    const rates = await this.findRatesByCurrencyCode(currency.code);
    return {
      ...currency,
      rates,
    };
  }

  async updateRate(code: string, updateRateDto: UpdateRateDto) {
    const currency = await this.findByCode(code);
    const pair =
      updateRateDto.pair?.trim().toUpperCase() || `${currency.code}USD`;
    return this.upsertRateByPair(pair, updateRateDto);
  }

  async findAllRates() {
    return this.rateRepository.find({
      order: {
        base_currency_code: 'ASC',
        quote_currency_code: 'ASC',
      },
    });
  }

  async findRateByPair(pair: string) {
    const normalizedPair = pair.trim().toUpperCase();
    const rate = await this.rateRepository.findOne({
      where: { pair: normalizedPair },
    });

    if (!rate) {
      throw new NotFoundException(`Currency rate ${normalizedPair} not found`);
    }

    return rate;
  }

  async findRatesByCurrencyCode(code: string) {
    return this.rateRepository.find({
      where: { base_currency_code: code.toUpperCase() },
      order: {
        quote_currency_code: 'ASC',
      },
    });
  }

  async upsertRateByPair(pair: string, updateRateDto: UpdateRateDto) {
    const normalizedPair = pair.trim().toUpperCase();
    if (!normalizedPair) {
      throw new BadRequestException('Pair is required');
    }

    const { baseCurrencyCode, quoteCurrencyCode } =
      await this.parsePair(normalizedPair);
    let rate = await this.rateRepository.findOne({
      where: { pair: normalizedPair },
    });

    const platform =
      updateRateDto.platform === undefined
        ? (rate?.platform ?? null)
        : updateRateDto.platform;
    const isAutoUpdate =
      updateRateDto.is_auto_update ?? rate?.is_auto_update ?? false;

    if (rate) {
      rate.base_currency_code = baseCurrencyCode;
      rate.quote_currency_code = quoteCurrencyCode;
      rate.ratio = updateRateDto.ratio;
      rate.is_auto_update = isAutoUpdate;
      rate.platform = platform;
    } else {
      rate = this.rateRepository.create({
        pair: normalizedPair,
        base_currency_code: baseCurrencyCode,
        quote_currency_code: quoteCurrencyCode,
        ratio: updateRateDto.ratio,
        is_auto_update: isAutoUpdate,
        platform,
      });
    }

    return this.rateRepository.save(rate);
  }

  async getUsdRateMap(codes: string[]): Promise<Map<string, number>> {
    const normalizedCodes = Array.from(
      new Set(
        codes
          .filter((code): code is string => Boolean(code))
          .map((code) => code.trim().toUpperCase()),
      ),
    );

    const rateMap = new Map<string, number>();
    if (normalizedCodes.length === 0) {
      return rateMap;
    }

    const directPairs = normalizedCodes.map((code) => `${code}USD`);
    const inversePairs = normalizedCodes.map((code) => `USD${code}`);
    const rates = await this.rateRepository.find({
      where: {
        pair: In([...directPairs, ...inversePairs]),
      },
    });

    for (const code of normalizedCodes) {
      if (code === 'USD') {
        rateMap.set(code, 1);
        continue;
      }

      const direct = rates.find((rate) => rate.pair === `${code}USD`);
      if (direct) {
        const ratio = Number(direct.ratio);
        if (Number.isFinite(ratio) && ratio > 0) {
          rateMap.set(code, ratio);
          continue;
        }
      }

      const inverse = rates.find((rate) => rate.pair === `USD${code}`);
      if (inverse) {
        const ratio = Number(inverse.ratio);
        if (Number.isFinite(ratio) && ratio > 0) {
          rateMap.set(code, 1 / ratio);
          continue;
        }
      }

      rateMap.set(code, 1);
    }

    return rateMap;
  }

  async getConversionRatesToTarget(
    sourceCodes: string[],
    targetCode: string,
  ): Promise<Map<string, number>> {
    const normalizedTargetCode = targetCode.trim().toUpperCase();
    const normalizedSourceCodes = Array.from(
      new Set(
        sourceCodes
          .filter((code): code is string => Boolean(code))
          .map((code) => code.trim().toUpperCase()),
      ),
    );

    const conversionMap = new Map<string, number>();
    if (normalizedSourceCodes.length === 0) {
      return conversionMap;
    }

    const directPairs = normalizedSourceCodes.map(
      (code) => `${code}${normalizedTargetCode}`,
    );
    const inversePairs = normalizedSourceCodes.map(
      (code) => `${normalizedTargetCode}${code}`,
    );
    const directAndInverseRates = await this.rateRepository.find({
      where: {
        pair: In([...directPairs, ...inversePairs]),
      },
    });

    const usdRateMap = await this.getUsdRateMap([
      normalizedTargetCode,
      ...normalizedSourceCodes,
    ]);
    const targetRateToUsd = usdRateMap.get(normalizedTargetCode) ?? 1;

    for (const code of normalizedSourceCodes) {
      if (code === normalizedTargetCode) {
        conversionMap.set(code, 1);
        continue;
      }

      const direct = directAndInverseRates.find(
        (rate) => rate.pair === `${code}${normalizedTargetCode}`,
      );
      const directRatio = this.getPositiveRatio(direct?.ratio);
      if (directRatio) {
        conversionMap.set(code, directRatio);
        continue;
      }

      const inverse = directAndInverseRates.find(
        (rate) => rate.pair === `${normalizedTargetCode}${code}`,
      );
      const inverseRatio = this.getPositiveRatio(inverse?.ratio);
      if (inverseRatio) {
        conversionMap.set(code, 1 / inverseRatio);
        continue;
      }

      const sourceRateToUsd = usdRateMap.get(code) ?? 1;
      conversionMap.set(code, sourceRateToUsd / targetRateToUsd);
    }

    return conversionMap;
  }

  // Helper for seeding
  async create(data: Partial<Currency>) {
    const currency = this.currencyRepository.create(data);
    return this.currencyRepository.save(currency);
  }

  private getPositiveRatio(value?: number): number | null {
    const ratio = Number(value);
    if (!Number.isFinite(ratio) || ratio <= 0) {
      return null;
    }
    return ratio;
  }

  private async attachRates(currencies: Currency[]) {
    if (currencies.length === 0) {
      return currencies;
    }

    const rates = await this.rateRepository.find({
      where: {
        base_currency_code: In(currencies.map((currency) => currency.code)),
      },
      order: {
        base_currency_code: 'ASC',
        quote_currency_code: 'ASC',
      },
    });

    const ratesByBaseCode = new Map<string, CurrencyRate[]>();
    for (const rate of rates) {
      const list = ratesByBaseCode.get(rate.base_currency_code) ?? [];
      list.push(rate);
      ratesByBaseCode.set(rate.base_currency_code, list);
    }

    return currencies.map((currency) => ({
      ...currency,
      rates: ratesByBaseCode.get(currency.code) ?? [],
    }));
  }

  private async parsePair(pair: string) {
    const currencies = await this.currencyRepository.find({
      select: {
        code: true,
      },
    });

    const codes = currencies
      .map((currency) => currency.code.toUpperCase())
      .sort((a, b) => b.length - a.length);

    for (const baseCode of codes) {
      if (!pair.startsWith(baseCode) || pair.length <= baseCode.length) {
        continue;
      }

      const quoteCode = pair.slice(baseCode.length);
      if (codes.includes(quoteCode)) {
        return {
          baseCurrencyCode: baseCode,
          quoteCurrencyCode: quoteCode,
        };
      }
    }

    throw new BadRequestException(
      `Pair ${pair} must be composed of two known currency codes`,
    );
  }
}
