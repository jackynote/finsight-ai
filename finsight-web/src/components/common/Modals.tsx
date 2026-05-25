
import React from 'react';
import { X, Calendar } from 'lucide-react';
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
      <div className={`relative bg-white w-full ${isModalOpen === 'assetDetails' ? 'max-w-xl' : 'max-w-md'} rounded-[32px] p-8 shadow-2xl animate-in zoom-in duration-200 flex flex-col max-h-[90vh]`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {isModalOpen === 'transaction' && 'New Entry'}
            {isModalOpen === 'asset' && 'New Asset'}
            {isModalOpen === 'updatePrice' && `Update ${selectedGroup?.currencyCode || selectedAsset?.name} Rate`}
            {isModalOpen === 'assetDetails' && `${selectedGroup?.currencyCode} Details`}
          </h2>
          <button onClick={onClose} className="text-slate-400 p-2 hover:text-slate-900 transition-colors"><X /></button>
        </div>

        <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
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

          {isModalOpen === 'assetDetails' && selectedGroup && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl mb-6 text-xs font-bold uppercase text-slate-500">
                <div>
                  <p>Total Quantity</p>
                  <p className="text-slate-900 text-lg">{selectedGroup.totalQuantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}</p>
                </div>
                <div className="text-right">
                  <p>Current Rate</p>
                  <p className="text-slate-900 text-lg">${selectedGroup.currentRateUsd.toLocaleString(undefined, { maximumFractionDigits: 6 })}</p>
                </div>
              </div>

              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Purchase History</h4>
              <div className="space-y-3">
                {selectedGroup.lots.map((lot) => {
                  const currentVal = lot.quantity * selectedGroup.currentRateUsd;
                  const purchaseVal = lot.quantity * lot.purchase_price;
                  const profit = currentVal - purchaseVal;
                  const profitPercent = (profit / purchaseVal) * 100;
                  
                  return (
                    <div key={lot.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                            <Calendar size={16} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Date</p>
                            <p className="text-sm font-bold text-slate-900">
                              {new Date(lot.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1 bg-slate-50 rounded-lg inline-block">
                            {lot.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })} units
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-50">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Buy Price</p>
                          <p className="text-sm font-bold text-slate-900">${lot.purchase_price.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Market Value</p>
                          <p className="text-sm font-bold text-slate-900">${currentVal.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Net Profit/Loss</span>
                        <span className={`text-sm font-bold flex items-center gap-1 ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {profit >= 0 ? '+' : ''}${Math.abs(profit).toLocaleString()}
                          <span className="text-[10px] opacity-80">({profitPercent.toFixed(1)}%)</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
