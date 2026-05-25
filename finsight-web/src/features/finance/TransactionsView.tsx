
import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType } from '../../types';
import { financeService } from './financeService';

export const TransactionsView: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        const txs = await financeService.getTransactions();
        setTransactions(txs);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-slate-50 rounded-2xl" />)}
    </div>;
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-50">
            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Date</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Details</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {transactions.map((tx) => (
            <tr key={tx.id} className="hover:bg-slate-50/50">
              <td className="px-6 py-4 text-sm text-slate-600">
                {tx.date || (tx.created_at ? new Date(tx.created_at).toISOString().split('T')[0] : 'N/A')}
              </td>
              <td className="px-6 py-4">
                <p className="text-sm font-semibold text-slate-900">{tx.description}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{tx.category}</p>
              </td>
              <td className={`px-6 py-4 text-sm font-bold text-right ${tx.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-slate-900'}`}>
                {tx.type === TransactionType.INCOME ? '+' : '-'}${Number(tx.amount).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
