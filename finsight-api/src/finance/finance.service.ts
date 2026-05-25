
import { Injectable } from '@nestjs/common';
import { TransactionsService } from '../transactions/transactions.service';
import { AssetsService } from '../assets/assets.service';

@Injectable()
export class FinanceService {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly assetsService: AssetsService,
  ) {}

  async getTotals(userId: string) {
    const [transactions, assets] = await Promise.all([
      this.transactionsService.findAll(userId),
      this.assetsService.findAll(userId),
    ]);

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

    // Calculate Asset Totals (matching frontend logic)
    let assetValue = 0;
    let assetPurchaseValue = 0;

    const groupedMap = new Map<string, any>();
    for (const asset of assets) {
      const key = asset.currency_id || `name:${asset.name}`;
      
      // Resolve Rate
      const rateObj = asset.currency?.rates?.[0];
      const currentRateUsd = rateObj ? Number(rateObj.rate_to_usd) : Number(asset.current_price);
      
      const quantity = Number(asset.quantity);
      const purchasePrice = Number(asset.purchase_price);

      if (groupedMap.has(key)) {
        const existing = groupedMap.get(key);
        existing.totalQuantity += quantity;
        existing.totalPurchaseValueUsd += purchasePrice * quantity;
        existing.currentRateUsd = currentRateUsd;
      } else {
        groupedMap.set(key, {
          totalQuantity: quantity,
          totalPurchaseValueUsd: purchasePrice * quantity,
          currentRateUsd,
        });
      }
    }

    for (const g of groupedMap.values()) {
      const currentValueUsd = g.totalQuantity * g.currentRateUsd;
      assetValue += currentValueUsd;
      assetPurchaseValue += g.totalPurchaseValueUsd;
    }

    const liquidBalance = txTotals.income - txTotals.expenses;

    return {
      income: txTotals.income,
      expenses: txTotals.expenses,
      balance: liquidBalance,
      assetValue: assetValue,
      assetGain: assetValue - assetPurchaseValue,
      netWorth: liquidBalance + assetValue,
    };
  }
}
