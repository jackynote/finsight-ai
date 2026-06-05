import React, { useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, CalendarDays, Receipt, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { COLORS } from '../../constants';
import { Transaction, GroupedAsset, DashboardPeriod, FinanceTotals } from '../../types';
import { formatMoney } from '../../utils/format';
import { calculateDailyCashFlow } from '../finance/financeUtils';

interface DashboardProps {
  totals: FinanceTotals;
  dashboardTotals: FinanceTotals;
  transactions: Transaction[];
  groupedAssets: GroupedAsset[];
  period: DashboardPeriod;
  onPeriodChange: (period: DashboardPeriod) => void;
}

const PERIOD_OPTIONS: { value: DashboardPeriod; label: string; metricLabel: string }[] = [
  { value: '30', label: 'Last 30 days', metricLabel: '30 days' },
  { value: '60', label: 'Last 60 days', metricLabel: '60 days' },
  { value: 'all', label: 'All time', metricLabel: 'All time' },
];

export const DashboardView: React.FC<DashboardProps> = ({
  totals,
  dashboardTotals,
  transactions,
  groupedAssets,
  period,
  onPeriodChange,
}) => {
  const displayTotals = {
    ...totals,
    ...dashboardTotals,
    currencyCode: dashboardTotals.currencyCode ?? totals.currencyCode ?? 'USD',
    currencySymbol: dashboardTotals.currencySymbol ?? totals.currencySymbol,
  };
  const selectedPeriod = PERIOD_OPTIONS.find((option) => option.value === period) ?? PERIOD_OPTIONS[0];
  const cashFlowData = useMemo(
    () => calculateDailyCashFlow(transactions, displayTotals.currencyCode, period),
    [transactions, displayTotals.currencyCode, period],
  );
  const totalTransactionAmount = useMemo(
    () => transactions.reduce((total, transaction) => total + Number(transaction.amount), 0),
    [transactions],
  );
  const transactionCategoryData = useMemo(() => {
    const categoryAmounts = new Map<string, number>();

    for (const transaction of transactions) {
      const categoryName = transaction.category?.value || transaction.category_code || 'Uncategorized';
      categoryAmounts.set(categoryName, (categoryAmounts.get(categoryName) ?? 0) + Number(transaction.amount));
    }

    return Array.from(categoryAmounts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((categoryA, categoryB) => categoryB.value - categoryA.value);
  }, [transactions]);
  const assetAllocationData = useMemo(
    () =>
      groupedAssets
        .map((group) => ({
          name: group.currencyCode,
          value: group.currentValue,
        }))
        .sort((assetA, assetB) => assetB.value - assetA.value),
    [groupedAssets],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-end">
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <CalendarDays size={18} className="text-slate-500" />
          <span className="text-sm font-semibold text-slate-700">Period</span>
          <select
            value={period}
            onChange={(event) => onPeriodChange(event.target.value as DashboardPeriod)}
            className="bg-transparent text-sm font-semibold text-slate-900 outline-none"
            aria-label="Dashboard time period"
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Transactions Report</h2>
          <p className="text-sm text-slate-500">Cash movement and spending activity for the selected period.</p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-1">
              <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div className="rounded-xl bg-blue-50 p-2 text-blue-600"><Receipt size={24} /></div>
                  <span className="rounded-lg bg-blue-50 px-2 py-1 text-sm font-medium text-blue-600">{selectedPeriod.metricLabel}</span>
                </div>
                <p className="font-medium text-slate-500">Transaction Amount</p>
                <h3 className="mt-1 break-words text-xl font-bold leading-tight text-slate-900 xl:text-2xl">
                  {formatMoney(totalTransactionAmount, displayTotals.currencySymbol, displayTotals.currencyCode)}
                </h3>
              </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="mb-6 text-lg font-bold">Transaction Amount by Category</h3>
              {transactionCategoryData.length > 0 ? (
                <>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={transactionCategoryData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {transactionCategoryData.map((_, index) => <Cell key={`transaction-category-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value, name) => [formatMoney(Number(value), displayTotals.currencySymbol, displayTotals.currencyCode), name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {transactionCategoryData.slice(0, 5).map((category, index) => (
                      <div key={category.name} className="flex items-center justify-between text-sm">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="truncate text-slate-600">{category.name}</span>
                        </div>
                        <span className="font-semibold text-slate-900">
                          {formatMoney(category.value, displayTotals.currencySymbol, displayTotals.currencyCode)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex h-56 items-center justify-center rounded-2xl bg-slate-50 text-sm font-medium text-slate-500">
                  No transactions in this period
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
            <h3 className="mb-6 text-lg font-bold">Cash Flow</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value) => formatMoney(Number(value), displayTotals.currencySymbol, displayTotals.currencyCode)}
                  />
                  <Bar dataKey="amount" fill="#0f172a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Assets Report</h2>
          <p className="text-sm text-slate-500">Portfolio performance and allocation across current holdings.</p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-xl bg-sky-50 p-2 text-sky-600"><Wallet size={24} /></div>
                <span className="rounded-lg bg-sky-50 px-2 py-1 text-sm font-medium text-sky-600">Current value</span>
              </div>
              <p className="font-medium text-slate-500">Total Amount</p>
              <h3 className="mt-1 break-words text-xl font-bold leading-tight text-slate-900 xl:text-2xl">
                {formatMoney(displayTotals.assetValue, displayTotals.currencySymbol, displayTotals.currencyCode)}
              </h3>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className={`rounded-xl p-2 ${displayTotals.assetGain >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {displayTotals.assetGain >= 0 ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                </div>
                <span className={`rounded-lg px-2 py-1 text-sm font-medium ${displayTotals.assetGain >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {((displayTotals.assetGain / (displayTotals.assetValue - displayTotals.assetGain || 1)) * 100).toFixed(1)}%
                </span>
              </div>
              <p className="font-medium text-slate-500">Investment Profit</p>
              <h3 className={`mt-1 break-words text-xl font-bold leading-tight xl:text-2xl ${displayTotals.assetGain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {displayTotals.assetGain >= 0 ? '+' : ''}{formatMoney(displayTotals.assetGain, displayTotals.currencySymbol, displayTotals.currencyCode)}
              </h3>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
            <h3 className="mb-6 text-lg font-bold">Asset Allocation</h3>
            {assetAllocationData.length > 0 ? (
              <>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={assetAllocationData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {assetAllocationData.map((_, index) => <Cell key={`asset-allocation-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value, name) => [formatMoney(Number(value), displayTotals.currencySymbol, displayTotals.currencyCode), name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {assetAllocationData.slice(0, 5).map((asset, index) => (
                    <div key={asset.name} className="flex items-center justify-between text-sm">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="truncate text-slate-600">{asset.name}</span>
                      </div>
                      <span className="font-semibold text-slate-900">
                        {formatMoney(asset.value, displayTotals.currencySymbol, displayTotals.currencyCode)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-56 items-center justify-center rounded-2xl bg-slate-50 text-sm font-medium text-slate-500">
                No assets available
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
