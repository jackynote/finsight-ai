
import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { financeService } from '../features/finance/financeService';
import { Transaction, TransactionType, TransactionCategory } from '../types';
import { useFinance } from '../contexts/FinanceContext';
import { Modals } from '../components/common/Modals';

const TransactionsPage: React.FC = () => {
  const { refreshTotals } = useFinance();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState<'transaction' | ''>('');

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

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleTransactionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      date: new Date().toISOString().split('T')[0],
      amount: Number(formData.get('amount')),
      category: formData.get('category') as TransactionCategory,
      description: formData.get('description') as string,
      type: formData.get('type') as TransactionType,
    };
    try {
      await financeService.createTransaction(data);
      await fetchTransactions();
      await refreshTotals();
      setIsModalOpen('');
    } catch (error) {
      console.error("Error creating transaction:", error);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading transactions...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <button 
          onClick={() => setIsModalOpen('transaction')} 
          className="bg-slate-900 text-white px-5 py-3 rounded-2xl font-semibold flex items-center gap-2 shadow-md hover:bg-slate-800 transition-all"
        >
          <Plus size={20} /> <span>Add Entry</span>
        </button>
      </div>

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

      {isModalOpen && (
        <Modals 
          isModalOpen={isModalOpen}
          onClose={() => setIsModalOpen('')}
          onSubmit={handleTransactionSubmit}
        />
      )}
    </div>
  );
};

export default TransactionsPage;
