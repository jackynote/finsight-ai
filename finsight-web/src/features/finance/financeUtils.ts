
import { DashboardPeriod, GroupedAsset, Transaction, TransactionType } from '../../types';
import { roundCurrencyAmount } from '../../utils/format';

export interface DailyCashFlow {
  date: string;
  label: string;
  amount: number;
}

export interface DailyCashFlowByCategory {
  date: string;
  label: string;
  [category: string]: string | number;
}

export const calculateTotals = (transactions: Transaction[], groupedAssets: GroupedAsset[]) => {
  const txTotals = transactions.reduce((acc, curr) => {
    if (curr.type === TransactionType.INCOME) acc.income += Number(curr.amount);
    else acc.expenses += Number(curr.amount);
    return acc;
  }, { income: 0, expenses: 0 });

  const assetValue = groupedAssets.reduce((acc, g) => acc + g.currentValue, 0);
  const assetPurchaseValue = groupedAssets.reduce((acc, g) => acc + g.totalPurchaseValue, 0);
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

export const calculateDailyCashFlowByCategory = (
  transactions: Transaction[],
  currencyCode: string = 'USD',
  period: DashboardPeriod = '30',
): { data: DailyCashFlowByCategory[]; categories: string[] } => {
  const dailyCategoryTotals = new Map<string, Map<string, number>>();
  const totalCategoryAmounts = new Map<string, number>();
  const categories = new Set<string>();

  for (const transaction of transactions) {
    const dateKey = transaction.date.slice(0, 10);
    const categoryName = transaction.category?.value || transaction.category_code || 'Uncategorized';
    categories.add(categoryName);
    totalCategoryAmounts.set(categoryName, (totalCategoryAmounts.get(categoryName) ?? 0) + Number(transaction.amount));

    const categoryTotals = dailyCategoryTotals.get(dateKey) ?? new Map<string, number>();
    categoryTotals.set(categoryName, (categoryTotals.get(categoryName) ?? 0) + Number(transaction.amount));
    dailyCategoryTotals.set(dateKey, categoryTotals);
  }

  const dateKeys = getCashFlowDateKeys(transactions, period);
  const sortedCategories = Array.from(categories).sort(
    (categoryA, categoryB) => (totalCategoryAmounts.get(categoryB) ?? 0) - (totalCategoryAmounts.get(categoryA) ?? 0),
  );

  const data = dateKeys.map((date) => {
    const [year, month, day] = date.split('-').map(Number);
    const entry: DailyCashFlowByCategory = {
      date,
      label: new Date(year, month - 1, day).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
    };

    const categoryTotals = dailyCategoryTotals.get(date) ?? new Map<string, number>();

    for (const category of sortedCategories) {
      entry[category] = roundCurrencyAmount(categoryTotals.get(category) ?? 0, currencyCode);
    }

    return entry;
  });

  return { data, categories: sortedCategories };
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
