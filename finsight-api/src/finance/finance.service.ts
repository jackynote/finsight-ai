import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionsService } from '../transactions/transactions.service';
import { AssetsService } from '../assets/assets.service';
import { User } from '../auth/entities/user.entity';
import { CurrenciesService } from '../currencies/currencies.service';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Asset } from '../assets/entities/asset.entity';

export interface GroupedAssetTotal {
  key: string;
  currencyCode: string;
  name: string;
  category: string;
  totalQuantity: number;
  currentRate: number;
  currentValue: number;
  totalPurchaseValue: number;
  avgPurchasePrice: number;
  gain: number;
  gainPercent: number;
  lots: AssetLotSummary[];
}

export interface AssetLotSummary {
  id: string;
  date: Date;
  quantity: number;
  purchasePrice: number;
  purchaseValue: number;
  currentValue: number;
  gain: number;
  gainPercent: number;
}

export type DashboardPeriod = '30' | '60' | 'all';

@Injectable()
export class FinanceService {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly assetsService: AssetsService,
    private readonly currenciesService: CurrenciesService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getTotals(userId: string) {
    const [transactions, assets, user] = await Promise.all([this.transactionsService.findAll(userId), this.assetsService.findAll(userId), this.userRepository.findOne({ where: { id: userId } })]);
    const defaultCurrency = user?.defaultCurrency || 'USD';
    const { totals } = await this.calculateAll(transactions, assets, defaultCurrency);
    return {
      ...totals,
      ...(await this.getDisplayCurrency(defaultCurrency)),
    };
  }

  async getGroupedAssets(userId: string) {
    const [assets, user] = await Promise.all([this.assetsService.findAll(userId), this.userRepository.findOne({ where: { id: userId } })]);
    const defaultCurrency = user?.defaultCurrency || 'USD';
    const { groupedAssets } = await this.calculateAll([], assets, defaultCurrency);
    return {
      groupedAssets,
      ...(await this.getDisplayCurrency(defaultCurrency)),
    };
  }

  async getDashboardData(userId: string, period: DashboardPeriod = '30') {
    const [transactions, assets, user] = await Promise.all([this.transactionsService.findAll(userId), this.assetsService.findAll(userId), this.userRepository.findOne({ where: { id: userId } })]);

    const normalizedPeriod = this.normalizeDashboardPeriod(period);
    const filteredTransactions = this.filterByPeriod(transactions, normalizedPeriod);
    const filteredAssets = this.filterByPeriod(assets, normalizedPeriod);

    const defaultCurrency = user?.defaultCurrency || 'USD';
    const { totals, groupedAssets } = await this.calculateAll(filteredTransactions, filteredAssets, defaultCurrency);
    const displayCurrency = await this.getDisplayCurrency(defaultCurrency);

    // Convert recent transactions for chart consistency
    const recentTransactionRateMap = await this.currenciesService.getUsdRateMap([defaultCurrency, ...filteredTransactions.map((tx) => tx.currency?.code)]);
    const rateToUsd = recentTransactionRateMap.get(defaultCurrency) ?? 1;

    const recentTransactions = filteredTransactions.map((tx) => {
      const txRateToUsd = recentTransactionRateMap.get(tx.currency?.code ?? '') ?? 1;
      const amountUsd = Number(tx.amount) * Number(txRateToUsd);
      return {
        ...tx,
        amount: amountUsd / rateToUsd, // Convert to default currency
      };
    });

    return {
      totals: {
        ...totals,
        ...displayCurrency,
      },
      recentTransactions,
      groupedAssets,
      period: normalizedPeriod,
    };
  }

  private normalizeDashboardPeriod(period: DashboardPeriod): DashboardPeriod {
    return period === '60' || period === 'all' ? period : '30';
  }

  private filterByPeriod<T extends { date: string | Date }>(items: T[], period: DashboardPeriod): T[] {
    if (period === 'all') return items;

    const days = Number(period);
    const cutoffDate = new Date();
    cutoffDate.setHours(0, 0, 0, 0);
    cutoffDate.setDate(cutoffDate.getDate() - days + 1);

    return items.filter((item) => {
      const itemDate = new Date(item.date);
      itemDate.setHours(0, 0, 0, 0);
      return itemDate >= cutoffDate;
    });
  }

  private async getDisplayCurrency(currencyCode: string) {
    try {
      const currency = await this.currenciesService.findByCode(currencyCode);
      return {
        currencySymbol: currency.symbol,
        currencyCode: currency.code,
      };
    } catch {
      return {
        currencySymbol: currencyCode === 'USD' ? '$' : undefined,
        currencyCode,
      };
    }
  }

  private async calculateAll(transactions: Transaction[], assets: Asset[], defaultCurrency: string) {
    const currencyCodes = [
      ...transactions.map((transaction) => transaction.currency?.code),
      ...assets.map((asset) => asset.currency?.code),
      ...assets.map((asset) => asset.purchase_currency?.code),
    ].filter((code): code is string => Boolean(code));
    const usdRateMap = await this.currenciesService.getUsdRateMap(currencyCodes);
    const conversionRateMap = await this.currenciesService.getConversionRatesToTarget(currencyCodes, defaultCurrency);

    const txTotals = transactions.reduce(
      (acc, curr) => {
        const rateToUsd = usdRateMap.get(curr.currency?.code ?? '') ?? 1;
        const amountUsd = Number(curr.amount) * Number(rateToUsd);
        if (curr.type === 'income') acc.income += amountUsd;
        else acc.expenses += amountUsd;
        return acc;
      },
      { income: 0, expenses: 0 },
    );

    // Calculate Asset Totals & Grouping
    let assetValue = 0;
    let assetPurchaseValue = 0;

    const groupedMap = new Map<
      string,
      {
        key: string;
        currencyCode: string;
        name: string;
        category: string;
        currentRate: number;
        totalQuantity: number;
        totalPurchaseValue: number;
        lots: AssetLotSummary[];
      }
    >();

    const sortedAssets = [...assets].sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;

      const createdAtDiff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (!Number.isNaN(createdAtDiff) && createdAtDiff !== 0) {
        return createdAtDiff;
      }

      return a.id.localeCompare(b.id);
    });

    for (const asset of sortedAssets) {
      const assetIdentity = await this.getAssetIdentity(asset);
      const key = assetIdentity.key;
      const assetCurrencyCode = assetIdentity.code;
      const purchaseCurrencyCode = asset.purchase_currency?.code || defaultCurrency;
      const currentRate = conversionRateMap.get(assetCurrencyCode) ?? 1;
      const purchaseConversionRate = conversionRateMap.get(purchaseCurrencyCode) ?? 1;

      const quantity = Number(asset.quantity);
      const purchasePrice = Number(asset.purchase_price);
      const convertedPurchasePrice = purchasePrice * purchaseConversionRate;
      const existing = groupedMap.get(key);

      if (!existing) {
        groupedMap.set(key, {
          key,
          currencyCode: assetCurrencyCode,
          name: assetIdentity.name,
          category: asset.category,
          totalQuantity: 0,
          currentRate,
          totalPurchaseValue: 0,
          lots: [],
        });
      }

      const group = groupedMap.get(key)!;
      group.currentRate = currentRate;

      let purchaseValue = convertedPurchasePrice * quantity;
      let currentValue = quantity > 0 ? quantity * currentRate : 0;
      let gain = currentValue - purchaseValue;
      let gainPercent = purchaseValue > 0 ? (gain / purchaseValue) * 100 : 0;

      if (quantity > 0) {
        group.totalQuantity += quantity;
        group.totalPurchaseValue += convertedPurchasePrice * quantity;
      } else {
        const sellQuantity = Math.abs(quantity);
        const averageCost = group.totalQuantity > 0 ? group.totalPurchaseValue / group.totalQuantity : 0;
        const costBasisReduction = averageCost * sellQuantity;

        group.totalQuantity += quantity;
        group.totalPurchaseValue = Math.max(0, group.totalPurchaseValue - costBasisReduction);

        purchaseValue = convertedPurchasePrice * sellQuantity;
        currentValue = 0;
        gain = 0;
        gainPercent = 0;
      }

      group.lots.push({
        id: asset.id,
        date: asset.date,
        quantity,
        purchasePrice: convertedPurchasePrice,
        purchaseValue,
        currentValue,
        gain,
        gainPercent,
      });
    }

    const groupedAssets: GroupedAssetTotal[] = Array.from(groupedMap.values())
      .filter((g) => g.totalQuantity > 0)
      .map((g) => {
        const currentValue = g.totalQuantity * g.currentRate;
        const avgPurchasePrice = g.totalQuantity > 0 ? g.totalPurchaseValue / g.totalQuantity : 0;
        const gain = currentValue - g.totalPurchaseValue;
        const gainPercent = g.totalPurchaseValue > 0 ? (gain / g.totalPurchaseValue) * 100 : 0;

        assetValue += currentValue;
        assetPurchaseValue += g.totalPurchaseValue;

        return {
          ...g,
          currentValue,
          avgPurchasePrice,
          gain,
          gainPercent,
          lots: [...g.lots].sort((a, b) => {
            const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
            if (dateDiff !== 0) return dateDiff;
            return b.id.localeCompare(a.id);
          }),
        };
      });

    const liquidBalance = txTotals.income - txTotals.expenses;
    const defaultCurrencyRateToUsd = usdRateMap.get(defaultCurrency) ?? 1;

    return {
      totals: {
        income: txTotals.income / defaultCurrencyRateToUsd,
        expenses: txTotals.expenses / defaultCurrencyRateToUsd,
        balance: liquidBalance / defaultCurrencyRateToUsd,
        assetValue,
        assetGain: assetValue - assetPurchaseValue,
        netWorth: liquidBalance / defaultCurrencyRateToUsd + assetValue,
      },
      groupedAssets,
    };
  }

  private async getAssetIdentity(asset: Asset) {
    if (asset.currency) {
      return {
        key: `currency:${asset.currency.id}`,
        code: asset.currency.code,
        name: asset.currency.name,
      };
    }

    if (asset.currency_id) {
      return {
        key: `currency:${asset.currency_id}`,
        code: asset.name,
        name: asset.name,
      };
    }

    const normalizedName = asset.name.trim().toUpperCase();
    const currency = await this.currenciesService.findByCode(normalizedName).catch(() => null);

    if (currency) {
      return {
        key: `currency:${currency.id}`,
        code: currency.code,
        name: currency.name,
      };
    }

    return {
      key: `name:${normalizedName}`,
      code: normalizedName,
      name: asset.name,
    };
  }
}
