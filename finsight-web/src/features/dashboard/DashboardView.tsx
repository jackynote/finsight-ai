
import React from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Sparkles, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { COLORS } from '../../constants';
import { Transaction, Asset, AIInsight, GroupedAsset } from '../../types';
import { formatMoney } from '../../utils/format';

interface DashboardProps {
  totals: any;
  transactions: Transaction[];
  assets: Asset[];
  groupedAssets: GroupedAsset[];
  insights: AIInsight[];
  setActiveTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardProps> = ({ totals, transactions, assets, groupedAssets, insights, setActiveTab }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600"><TrendingUp size={24} /></div>
            <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Monthly</span>
          </div>
          <p className="text-slate-500 font-medium">Liquid Balance</p>
          <h3 className={`text-3xl font-bold mt-1 ${totals.balance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
            {formatMoney(totals.balance, totals.currencySymbol, totals.currencyCode)}
          </h3>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-xl ${totals.assetGain >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {totals.assetGain >= 0 ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
            </div>
            <span className={`text-sm font-medium px-2 py-1 rounded-lg ${totals.assetGain >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
              {((totals.assetGain / (totals.assetValue - totals.assetGain || 1)) * 100).toFixed(1)}%
            </span>
          </div>
          <p className="text-slate-500 font-medium">Investment Profit</p>
          <h3 className={`text-3xl font-bold mt-1 ${totals.assetGain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {totals.assetGain >= 0 ? '+' : ''}{formatMoney(totals.assetGain, totals.currencySymbol, totals.currencyCode)}
          </h3>
        </div>

        <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-lg mb-6">Cash Flow</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={transactions.slice(-10).reverse()}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" hide />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="amount" fill="#0f172a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="space-y-8">
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
  );
};
