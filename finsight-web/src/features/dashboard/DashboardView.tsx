
import React, { useMemo } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Sparkles, ChevronRight, CalendarDays, Receipt } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { COLORS } from '../../constants';
import { Transaction, AIInsight, GroupedAsset, DashboardPeriod, FinanceTotals } from '../../types';
import { formatMoney } from '../../utils/format';
import { calculateDailyCashFlow } from '../finance/financeUtils';

interface DashboardProps {
  totals: FinanceTotals;
  dashboardTotals: FinanceTotals;
  transactions: Transaction[];
  groupedAssets: GroupedAsset[];
  insights: AIInsight[];
  period: DashboardPeriod;
  onPeriodChange: (period: DashboardPeriod) => void;
  setActiveTab: (tab: any) => void;
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
  insights,
  period,
  onPeriodChange,
  setActiveTab,
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

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600"><TrendingUp size={24} /></div>
                <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{selectedPeriod.metricLabel}</span>
              </div>
              <p className="text-slate-500 font-medium">Liquid Balance</p>
              <h3 className={`mt-1 break-words text-xl font-bold leading-tight xl:text-2xl ${displayTotals.balance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                {formatMoney(displayTotals.balance, displayTotals.currencySymbol, displayTotals.currencyCode)}
              </h3>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-xl ${displayTotals.assetGain >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {displayTotals.assetGain >= 0 ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                </div>
                <span className={`text-sm font-medium px-2 py-1 rounded-lg ${displayTotals.assetGain >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                  {((displayTotals.assetGain / (displayTotals.assetValue - displayTotals.assetGain || 1)) * 100).toFixed(1)}%
                </span>
              </div>
              <p className="text-slate-500 font-medium">Investment Profit</p>
              <h3 className={`mt-1 break-words text-xl font-bold leading-tight xl:text-2xl ${displayTotals.assetGain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {displayTotals.assetGain >= 0 ? '+' : ''}{formatMoney(displayTotals.assetGain, displayTotals.currencySymbol, displayTotals.currencyCode)}
              </h3>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-50 p-2 rounded-xl text-blue-600"><Receipt size={24} /></div>
                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{selectedPeriod.metricLabel}</span>
              </div>
              <p className="text-slate-500 font-medium">Transaction Amount</p>
              <h3 className="mt-1 break-words text-xl font-bold leading-tight text-slate-900 xl:text-2xl">
                {formatMoney(totalTransactionAmount, displayTotals.currencySymbol, displayTotals.currencyCode)}
              </h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-lg mb-6">Cash Flow</h3>
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

      <div className="space-y-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-lg mb-6">Transaction Amount by Category</h3>
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
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
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

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-lg mb-6">Asset Allocation</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={groupedAssets.map(g => ({ name: g.currencyCode, value: g.currentValueUsd }))} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {groupedAssets.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl relative group overflow-hidden">
          <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
            <Sparkles size={18} className="text-blue-400" /> {insights.length > 0 ? insights[0].title : "AI Intelligence"}
          </h3>
          <p className="text-slate-300 text-sm mb-4">
            {insights.length > 0 ? insights[0].content : "Analyzing your data for new insights..."}
          </p>
          <button onClick={() => setActiveTab('insights')} className="text-sm font-semibold flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors">
            View All Insights <ChevronRight size={16} />
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};
