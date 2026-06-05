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
  currencySymbol?: string;
  name: string;
  category: string;
  totalQuantity: number;
  currentRateUsd: number;
  currentValueUsd: number;
  totalPurchaseValueUsd: number;
  avgPurchasePriceUsd: number;
  gainUsd: number;
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
    const [transactions, assets, user] = await Promise.all([
      this.transactionsService.findAll(userId),
      this.assetsService.findAll(userId),
      this.userRepository.findOne({ where: { id: userId } }),
    ]);
    const { totals } = await this.calculateAll(transactions, assets);
    return this.convertToDefaultCurrency(
      totals,
      user?.defaultCurrency || 'USD',
    );
  }

  async getDashboardData(userId: string, period: DashboardPeriod = '30') {
    const [transactions, assets, user] = await Promise.all([
      this.transactionsService.findAll(userId),
      this.assetsService.findAll(userId),
      this.userRepository.findOne({ where: { id: userId } }),
    ]);

    const normalizedPeriod = this.normalizeDashboardPeriod(period);
    const filteredTransactions = this.filterByPeriod(
      transactions,
      normalizedPeriod,
    );
    const filteredAssets = this.filterByPeriod(assets, normalizedPeriod);

    const { totals, groupedAssets } = await this.calculateAll(
      filteredTransactions,
      filteredAssets,
    );
    const defaultCurrency = user?.defaultCurrency || 'USD';
    const convertedTotals = await this.convertToDefaultCurrency(
      totals,
      defaultCurrency,
    );

    // Convert recent transactions for chart consistency
    const recentTransactionRateMap = await this.currenciesService.getUsdRateMap(
      [defaultCurrency, ...filteredTransactions.map((tx) => tx.currency?.code)],
    );
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
      totals: convertedTotals,
      recentTransactions,
      groupedAssets,
      period: normalizedPeriod,
    };
  }

  private normalizeDashboardPeriod(period: DashboardPeriod): DashboardPeriod {
    return period === '60' || period === 'all' ? period : '30';
  }

  private filterByPeriod<T extends { date: string | Date }>(
    items: T[],
    period: DashboardPeriod,
  ): T[] {
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

  private async convertToDefaultCurrency(totals: any, currencyCode: string) {
    if (currencyCode === 'USD') return totals;

    try {
      const currency = await this.currenciesService.findByCode(currencyCode);
      const rateMap = await this.currenciesService.getUsdRateMap([currency.code]);
      const rateToUsd = rateMap.get(currency.code) ?? 1;

      return {
        income: totals.income / rateToUsd,
        expenses: totals.expenses / rateToUsd,
        balance: totals.balance / rateToUsd,
        assetValue: totals.assetValue / rateToUsd,
        assetGain: totals.assetGain / rateToUsd,
        netWorth: totals.netWorth / rateToUsd,
        currencySymbol: currency.symbol,
        currencyCode: currency.code,
      };
    } catch (error) {
      return totals;
    }
  }

  private async calculateAll(transactions: Transaction[], assets: Asset[]) {
    const currencyCodes = [
      ...transactions.map((transaction) => transaction.currency?.code),
      ...assets.map((asset) => asset.currency?.code),
    ].filter((code): code is string => Boolean(code));
    const usdRateMap = await this.currenciesService.getUsdRateMap(currencyCodes);

    // Calculate Transaction Totals
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

    const groupedMap = new Map<string, any>();
    for (const asset of assets) {
      const key = asset.currency_id || `name:${asset.name}`;

      const mappedRate = asset.currency?.code
        ? usdRateMap.get(asset.currency.code)
        : undefined;
      const currentRateUsd = mappedRate ?? Number(asset.current_price);

      const quantity = Number(asset.quantity);
      const purchasePrice = Number(asset.purchase_price);

      if (groupedMap.has(key)) {
        const existing = groupedMap.get(key);
        existing.totalQuantity += quantity;
        existing.totalPurchaseValueUsd += purchasePrice * quantity;
        existing.currentRateUsd = currentRateUsd;
        existing.lots.push(asset);
      } else {
        groupedMap.set(key, {
          key,
          currencyCode: asset.currency?.code || asset.name,
          currencySymbol: asset.currency?.symbol,
          name: asset.currency?.name || asset.name,
          category: asset.category,
          totalQuantity: quantity,
          currentRateUsd,
          totalPurchaseValueUsd: purchasePrice * quantity,
          lots: [asset],
        });
      }
    }

    const groupedAssets: GroupedAssetTotal[] = Array.from(
      groupedMap.values(),
    ).map((g) => {
      const currentValueUsd = g.totalQuantity * g.currentRateUsd;
      const avgPurchasePriceUsd =
        g.totalQuantity > 0 ? g.totalPurchaseValueUsd / g.totalQuantity : 0;
      const gainUsd = currentValueUsd - g.totalPurchaseValueUsd;
      const gainPercent =
        g.totalPurchaseValueUsd > 0
          ? (gainUsd / g.totalPurchaseValueUsd) * 100
          : 0;

      assetValue += currentValueUsd;
      assetPurchaseValue += g.totalPurchaseValueUsd;

      return {
        ...g,
        currentValueUsd,
        avgPurchasePriceUsd,
        gainUsd,
        gainPercent,
      };
    });

    const liquidBalance = txTotals.income - txTotals.expenses;

    return {
      totals: {
        income: txTotals.income,
        expenses: txTotals.expenses,
        balance: liquidBalance,
        assetValue: assetValue,
        assetGain: assetValue - assetPurchaseValue,
        netWorth: liquidBalance + assetValue,
      },
      groupedAssets,
    };
  }
}
