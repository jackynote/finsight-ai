
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import { financeService } from '../features/finance/financeService';
import { Transaction, TransactionType, TransactionCategory, Currency } from '../types';
import { useFinance } from '../contexts/FinanceContext';
import { useAuth } from '../contexts/AuthContext';
import { Modals } from '../components/common/Modals';
import { formatMoney } from '../utils/format';

const TransactionsPage: React.FC = () => {
  const { user } = useAuth();
  const { refreshTotals } = useFinance();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState<'transaction' | 'deleteConfirm' | ''>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [txs, currs] = await Promise.all([
        financeService.getTransactions(),
        financeService.getCurrencies()
      ]);
      setTransactions(txs);
      setCurrencies(currs);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTransactionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Use user's default currency if available
    const defaultCurrency = user?.defaultCurrency || 'USD';
    const currency = currencies.find(c => c.code === defaultCurrency);

    const data = {
      date: formData.get('date') as string || new Date().toISOString().split('T')[0],
      amount: Number(formData.get('amount')),
      category: formData.get('category') as TransactionCategory,
      description: formData.get('description') as string,
      type: formData.get('type') as TransactionType,
      currency_id: currency?.id,
    };
    try {
      if (selectedTransaction) {
        // Update existing transaction
        await financeService.updateTransaction(selectedTransaction.id, data);
      } else {
        // Create new transaction
        await financeService.createTransaction(data);
      }
      await fetchData();
      await refreshTotals();
      setIsModalOpen('');
      setSelectedTransaction(null);
    } catch (error) {
      console.error("Error saving transaction:", error);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen('transaction');
  };

  const handleDelete = (id: string) => {
    setSelectedId(id);
    setIsModalOpen('deleteConfirm');
  };

  const confirmDelete = async () => {
    if (!selectedId) return;
    try {
      await financeService.deleteTransaction(selectedId);
      await fetchData();
      await refreshTotals();
      setIsModalOpen('');
      setSelectedId(null);
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading transactions...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <button 
          onClick={() => {
            setSelectedTransaction(null);
            setIsModalOpen('transaction');
          }}
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
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Actions</th>
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
                  {tx.type === TransactionType.INCOME ? '+' : '-'}{formatMoney(Number(tx.amount), tx.currency?.symbol, tx.currency?.code)}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEdit(tx)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <Modals 
          isModalOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen('');
            setSelectedId(null);
            setSelectedTransaction(null);
          }}
          onSubmit={handleTransactionSubmit}
          onConfirm={confirmDelete}
          confirmTitle="Delete Transaction"
          confirmMessage="Are you sure you want to delete this transaction? This action cannot be undone."
          currencies={currencies}
          selectedTransaction={selectedTransaction}
        />
      )}
    </div>
  );
};

export default TransactionsPage;
