import { Injectable } from '@nestjs/common';
import { TransactionsService } from '../transactions/transactions.service';
import { AssetsService } from '../assets/assets.service';
import { AiService } from '../ai/ai.service';

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

@Injectable()
export class FinanceService {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly assetsService: AssetsService,
    private readonly aiService: AiService,
  ) {}

  async getTotals(userId: string) {
    const [transactions, assets] = await Promise.all([
      this.transactionsService.findAll(userId),
      this.assetsService.findAll(userId),
    ]);
    return this.calculateAll(transactions, assets).totals;
  }

  async getDashboardData(userId: string) {
    const [transactions, assets, cachedInsights] = await Promise.all([
      this.transactionsService.findAll(userId),
      this.assetsService.findAll(userId),
      this.aiService.findAllByUserId(userId),
    ]);

    const { totals, groupedAssets } = this.calculateAll(transactions, assets);

    let insights = cachedInsights;

    // Logic: If no insights OR they are older than 1 hour, generate new ones
    const shouldRefresh =
      cachedInsights.length === 0 ||
      new Date().getTime() - new Date(cachedInsights[0].created_at).getTime() >
        1 * 60 * 60 * 1000;

    if (shouldRefresh) {
      if (cachedInsights.length === 0) {
        // Force wait if none exist
        const result = await this.aiService.generateAndSaveInsights(
          userId,
          transactions.slice(0, 10),
          assets,
        );
        insights = result.insights;
      } else {
        // Trigger background refresh and return cached for now
        this.aiService
          .generateAndSaveInsights(userId, transactions.slice(0, 10), assets)
          .catch(console.error);
      }
    }

    return {
      totals,
      recentTransactions: transactions.slice(0, 10),
      groupedAssets,
      insights,
    };
  }

  private calculateAll(transactions: any[], assets: any[]) {
    // Calculate Transaction Totals
    const txTotals = transactions.reduce(
      (acc, curr) => {
        const amount = Number(curr.amount);
        if (curr.type === 'income') acc.income += amount;
        else acc.expenses += amount;
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

      const rateObj = asset.currency?.rates?.[0];
      const currentRateUsd = rateObj
        ? Number(rateObj.rate_to_usd)
        : Number(asset.current_price);

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
