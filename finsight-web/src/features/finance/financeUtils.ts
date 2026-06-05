
import { Asset, DashboardPeriod, GroupedAsset, Transaction, TransactionType } from '../../types';
import { roundCurrencyAmount } from '../../utils/format';

export interface DailyCashFlow {
  date: string;
  label: string;
  amount: number;
}

const resolveUsdValueFromRate = (
  currencyCode?: string,
  rate?: { pair?: string; ratio?: number | string | null },
): number | null => {
  if (!currencyCode || !rate?.pair || rate.ratio === undefined || rate.ratio === null) {
    return null;
  }

  const normalizedCode = currencyCode.toUpperCase();
  const normalizedPair = rate.pair.replace(/\s+/g, '').toUpperCase();
  const numericRatio = Number(rate.ratio);

  if (!Number.isFinite(numericRatio) || numericRatio <= 0) {
    return null;
  }

  if (normalizedPair === `${normalizedCode}USD`) {
    return numericRatio;
  }

  if (normalizedPair === `USD${normalizedCode}`) {
    return 1 / numericRatio;
  }

  return numericRatio;
};

export const resolveRate = (asset: Asset): number => {
  const rate = resolveUsdValueFromRate(
    asset.currency?.code,
    asset.currency?.rates?.[0],
  );
  if (rate !== null) return rate;
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
  period: DashboardPeriod = '30',
): DailyCashFlow[] => {
  const dailyTotals = new Map<string, number>();

  for (const transaction of transactions) {
    const dateKey = transaction.date.slice(0, 10);
    const currentAmount = dailyTotals.get(dateKey) ?? 0;
    dailyTotals.set(dateKey, currentAmount + Number(transaction.amount));
  }

  const dateKeys = getCashFlowDateKeys(transactions, period);

  return dateKeys.map((date) => {
    const [year, month, day] = date.split('-').map(Number);
      return {
        date,
        label: new Date(year, month - 1, day).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        amount: roundCurrencyAmount(dailyTotals.get(date) ?? 0, currencyCode),
      };
  });
};

const getCashFlowDateKeys = (
  transactions: Transaction[],
  period: DashboardPeriod,
): string[] => {
  const today = startOfDay(new Date());

  if (period === '30' || period === '60') {
    const days = Number(period);
    const startDate = addDays(today, -days + 1);
    return getDateRangeKeys(startDate, today);
  }

  if (transactions.length === 0) return [];

  const firstTransactionDate = transactions.reduce((earliestDate, transaction) => {
    const transactionDate = parseDateKey(transaction.date.slice(0, 10));
    return transactionDate < earliestDate ? transactionDate : earliestDate;
  }, parseDateKey(transactions[0].date.slice(0, 10)));

  return getDateRangeKeys(firstTransactionDate, today);
};

const getDateRangeKeys = (startDate: Date, endDate: Date): string[] => {
  const dateKeys: string[] = [];
  const cursor = startOfDay(startDate);
  const finalDate = startOfDay(endDate);

  while (cursor <= finalDate) {
    dateKeys.push(formatDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dateKeys;
};

const parseDateKey = (dateKey: string): Date => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const startOfDay = (date: Date): Date => {
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);
  return normalizedDate;
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
