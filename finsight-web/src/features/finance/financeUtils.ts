
import { Asset, GroupedAsset, Transaction, TransactionType } from '../../types';
import { roundCurrencyAmount } from '../../utils/format';

export interface DailyCashFlow {
  date: string;
  label: string;
  amount: number;
}

export const resolveRate = (asset: Asset): number => {
  const rate = asset.currency?.rates?.[0]?.rate_to_usd;
  if (rate !== undefined && rate !== null) return Number(rate);
  return Number(asset.current_price);
};

export const calculateGroupedAssets = (assets: Asset[]): GroupedAsset[] => {
  const map = new Map<string, GroupedAsset>();
  for (const asset of assets) {
    const key = asset.currency_id || `name:${asset.name}`;
    const currentRateUsd = resolveRate(asset);
    const quantity = Number(asset.quantity);
    const purchasePrice = Number(asset.purchase_price);
    const existing = map.get(key);
    if (existing) {
      existing.totalQuantity += quantity;
      existing.totalPurchaseValueUsd += purchasePrice * quantity;
      existing.currentRateUsd = currentRateUsd;
      existing.lots.push(asset);
    } else {
      map.set(key, {
        key,
        currencyCode: asset.currency?.code || asset.name,
        currencySymbol: asset.currency?.symbol,
        name: asset.currency?.name || asset.name,
        category: asset.category,
        totalQuantity: quantity,
        currentRateUsd,
        currentValueUsd: 0,
        totalPurchaseValueUsd: purchasePrice * quantity,
        avgPurchasePriceUsd: 0,
        gainUsd: 0,
        gainPercent: 0,
        lots: [asset],
      });
    }
  }
  return Array.from(map.values()).map((g) => {
    const currentValueUsd = g.totalQuantity * g.currentRateUsd;
    const avgPurchasePriceUsd = g.totalQuantity > 0 ? g.totalPurchaseValueUsd / g.totalQuantity : 0;
    const gainUsd = currentValueUsd - g.totalPurchaseValueUsd;
    const gainPercent = g.totalPurchaseValueUsd > 0 ? (gainUsd / g.totalPurchaseValueUsd) * 100 : 0;
    return { ...g, currentValueUsd, avgPurchasePriceUsd, gainUsd, gainPercent };
  });
};

export const calculateTotals = (transactions: Transaction[], groupedAssets: GroupedAsset[]) => {
  const txTotals = transactions.reduce((acc, curr) => {
    if (curr.type === TransactionType.INCOME) acc.income += Number(curr.amount);
    else acc.expenses += Number(curr.amount);
    return acc;
  }, { income: 0, expenses: 0 });

  const assetValue = groupedAssets.reduce((acc, g) => acc + g.currentValueUsd, 0);
  const assetPurchaseValue = groupedAssets.reduce((acc, g) => acc + g.totalPurchaseValueUsd, 0);
  const liquidBalance = txTotals.income - txTotals.expenses;

  return {
    ...txTotals,
    balance: liquidBalance,
    assetValue,
    assetGain: assetValue - assetPurchaseValue,
    netWorth: liquidBalance + assetValue,
  };
};

export const calculateDailyCashFlow = (
  transactions: Transaction[],
  currencyCode: string = 'USD',
): DailyCashFlow[] => {
  const dailyTotals = new Map<string, number>();

  for (const transaction of transactions) {
    const dateKey = transaction.date.slice(0, 10);
    const currentAmount = dailyTotals.get(dateKey) ?? 0;
    dailyTotals.set(dateKey, currentAmount + Number(transaction.amount));
  }

  return Array.from(dailyTotals.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, amount]) => {
      const [year, month, day] = date.split('-').map(Number);
      return {
        date,
        label: new Date(year, month - 1, day).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        amount: roundCurrencyAmount(amount, currencyCode),
      };
    });
};
