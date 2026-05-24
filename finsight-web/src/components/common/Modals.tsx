
import React from 'react';
import { X } from 'lucide-react';
import { TransactionType, TransactionCategory, GroupedAsset, Currency } from '../../types';

interface ModalProps {
  isModalOpen: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  selectedAsset?: any;
  selectedGroup?: GroupedAsset | null;
  currencies?: Currency[];
}

export const Modals: React.FC<ModalProps> = ({ isModalOpen, onClose, onSubmit, selectedAsset, selectedGroup, currencies = [] }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl animate-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {isModalOpen === 'transaction' && 'New Entry'}
            {isModalOpen === 'asset' && 'New Asset'}
            {isModalOpen === 'updatePrice' && `Update ${selectedGroup?.currencyCode || selectedAsset?.name} Rate`}
          </h2>
          <button onClick={onClose} className="text-slate-400 p-2"><X /></button>
        </div>

        {isModalOpen === 'transaction' && (
          <form onSubmit={onSubmit} className="space-y-4">
            <select name="type" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900">
              <option value={TransactionType.EXPENSE}>Expense</option>
              <option value={TransactionType.INCOME}>Income</option>
            </select>
            <input required name="description" type="text" placeholder="Description" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900" />
            <div className="grid grid-cols-2 gap-4">
              <input required name="amount" type="number" step="0.01" placeholder="Amount" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900" />
              <select name="category" required className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900">
                <option value="">Category</option>
                {Object.values(TransactionCategory).map((cat) => (
                  <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl mt-4">Save Entry</button>
          </form>
        )}

        {isModalOpen === 'asset' && (
          <form onSubmit={onSubmit} className="space-y-4">
            <select name="currency_id" required defaultValue="" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900">
              <option value="" disabled>Select Asset</option>
              {currencies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name} ({c.type})
                </option>
              ))}
            </select>
            {currencies.length === 0 && (
              <p className="text-xs text-rose-500">No currencies available. Seed currencies on the backend first.</p>
            )}
            <div className="grid grid-cols-2 gap-4">
              <input required name="purchasePrice" type="number" step="0.000001" placeholder="Purchase Price (USD)" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900" />
              <input required name="quantity" type="number" step="0.000001" placeholder="Quantity" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900" />
            </div>
            <button type="submit" disabled={currencies.length === 0} className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl mt-4 disabled:bg-slate-400 disabled:cursor-not-allowed">Add Asset</button>
          </form>
        )}

        {isModalOpen === 'updatePrice' && (
          <form onSubmit={onSubmit} className="space-y-4">
            {selectedGroup && (
              <p className="text-xs text-slate-500">
                Updating the rate will apply across all {selectedGroup.lots.length} {selectedGroup.lots.length === 1 ? 'lot' : 'lots'} of {selectedGroup.currencyCode}.
              </p>
            )}
            <input required name="currentPrice" type="number" step="0.000001" defaultValue={selectedGroup?.currentRateUsd ?? selectedAsset?.current_price} placeholder="Rate in USD" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900" />
            <button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl mt-4">Update Rate</button>
          </form>
        )}
      </div>
    </div>
  );
};
