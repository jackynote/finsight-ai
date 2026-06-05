
import React, { useState, useEffect } from 'react';
import { X, Calendar, Trash2 } from 'lucide-react';
import {
  TransactionType,
  TransactionCategory,
  GroupedAsset,
  Currency,
} from '../../types';
import { formatNumberWithCommas } from '../../utils/format';

interface ModalProps {
  isModalOpen: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onDeleteAsset?: (id: string) => void;
  onConfirm?: () => void;
  confirmTitle?: string;
  confirmMessage?: string;
  selectedAsset?: any;
  selectedGroup?: GroupedAsset | null;
  currencies?: Currency[];
  displayCurrencyCode?: string;
  displayCurrencySymbol?: string;
  transactionCategories?: TransactionCategory[];
  selectedTransaction?: any;
}

export const ConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-slate-400 p-2 hover:text-slate-900 transition-colors"><X size={20} /></button>
        </div>
        <div className="space-y-6">
          <p className="text-slate-600 leading-relaxed text-sm">
            {message}
          </p>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 bg-slate-100 text-slate-900 font-bold py-3 rounded-2xl hover:bg-slate-200 transition-colors text-sm"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 bg-rose-600 text-white font-bold py-3 rounded-2xl hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200 text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Modals: React.FC<ModalProps> = ({ 
  isModalOpen, 
  onClose, 
  onSubmit, 
  onDeleteAsset, 
  onConfirm,
  confirmTitle,
  confirmMessage,
  selectedAsset, 
  selectedGroup, 
  currencies = [],
  displayCurrencyCode = 'USD',
  displayCurrencySymbol = '$',
  transactionCategories = [],
  selectedTransaction,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [rawAmount, setRawAmount] = useState<string>(
    selectedTransaction ? selectedTransaction.amount.toString() : ''
  );

  useEffect(() => {
    if (isModalOpen === 'transaction') {
      if (selectedTransaction) {
        setRawAmount(selectedTransaction.amount.toString());
      } else {
        setRawAmount('');
      }
    }
  }, [selectedTransaction, isModalOpen]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits and one decimal point
    const numericValue = value.replace(/[^\d.]/g, '');
    
    // Prevent multiple decimal points
    if ((numericValue.match(/\./g) || []).length <= 1) {
      setRawAmount(numericValue);
    }
  };

  const displayAmount = rawAmount ? formatNumberWithCommas(parseFloat(rawAmount) || 0) : '';

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative bg-white w-full ${isModalOpen === 'assetDetails' ? 'max-w-xl' : 'max-w-md'} rounded-[32px] p-8 shadow-2xl animate-in zoom-in duration-200 flex flex-col max-h-[90vh]`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {isModalOpen === 'transaction' && (selectedTransaction ? 'Edit Entry' : 'New Entry')}
              {isModalOpen === 'asset' && 'New Asset'}
              {isModalOpen === 'assetDetails' && `${selectedGroup?.currencyCode} Details`}
              {isModalOpen === 'deleteConfirm' && (confirmTitle || 'Are you sure?')}
            </h2>
            <button onClick={onClose} className="text-slate-400 p-2 hover:text-slate-900 transition-colors"><X /></button>
          </div>

          <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
            {isModalOpen === 'deleteConfirm' && (
              <div className="space-y-6">
                <p className="text-slate-600 leading-relaxed">
                  {confirmMessage || 'This action cannot be undone. Do you want to continue?'}
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={onClose}
                    className="flex-1 bg-slate-100 text-slate-900 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      if (onConfirm) onConfirm();
                    }}
                    className="flex-1 bg-rose-600 text-white font-bold py-4 rounded-2xl hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
            {/* ... other modal contents ... */}
            {isModalOpen === 'transaction' && (
              <form onSubmit={onSubmit} className="space-y-4">
                <select name="type" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900" defaultValue={selectedTransaction?.type || TransactionType.EXPENSE}>
                  <option value={TransactionType.EXPENSE}>Expense</option>
                  <option value={TransactionType.INCOME}>Income</option>
                </select>
                <input required name="description" type="text" placeholder="Description" defaultValue={selectedTransaction?.description || ''} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900" />
                <input required name="date" type="date" defaultValue={selectedTransaction?.date || new Date().toISOString().split('T')[0]} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input required name="amount" type="text" inputMode="decimal" placeholder="0.00" value={rawAmount} onChange={handleAmountChange} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900" />
                    {displayAmount && displayAmount !== '0.00' && (
                      <div className="text-xs text-slate-500 font-semibold mt-1 px-1">
                        = {displayAmount}
                      </div>
                    )}
                  </div>
                  <select
                    name="category_code"
                    required
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900"
                    defaultValue={selectedTransaction?.category_code || ''}
                  >
                    <option value="">Category</option>
                    {transactionCategories.map((cat) => (
                      <option key={cat.code} value={cat.code}>
                        {cat.value}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl mt-4">{selectedTransaction ? 'Update Entry' : 'Save Entry'}</button>
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
                  <input required name="purchasePrice" type="number" step="0.000001" placeholder={`Purchase Price (${displayCurrencyCode})`} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900" />
                  <input required name="quantity" type="number" step="0.000001" placeholder="Quantity" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900" />
                </div>
                <button type="submit" disabled={currencies.length === 0} className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl mt-4 disabled:bg-slate-400 disabled:cursor-not-allowed">Add Asset</button>
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
                    <p className="text-slate-900 text-lg">{displayCurrencySymbol}{selectedGroup.currentRate.toLocaleString(undefined, { maximumFractionDigits: 6 })}</p>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Purchase History</h4>
                <div className="space-y-3">
                  {selectedGroup.lots.map((lot) => {
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
                          <div className="text-right flex flex-col items-end gap-2">
                            <p className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1 bg-slate-50 rounded-lg inline-block">
                              {lot.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })} units
                            </p>
                            {onDeleteAsset && (
                              <button 
                                onClick={() => setDeleteConfirmId(lot.id)}
                                className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete Asset"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-50">
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Buy Price</p>
                            <p className="text-sm font-bold text-slate-900">{displayCurrencySymbol}{lot.purchasePrice.toLocaleString(undefined, { maximumFractionDigits: 6 })}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Market Value</p>
                            <p className="text-sm font-bold text-slate-900">{displayCurrencySymbol}{lot.currentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                          </div>
                        </div>

                        <div className="mt-3 flex justify-between items-center">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Net Profit/Loss</span>
                          <span className={`text-sm font-bold flex items-center gap-1 ${lot.gain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {lot.gain >= 0 ? '+' : ''}{displayCurrencySymbol}{Math.abs(lot.gain).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            <span className="text-[10px] opacity-80">({lot.gainPercent.toFixed(1)}%)</span>
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
      <ConfirmationModal 
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && onDeleteAsset?.(deleteConfirmId)}
        title="Delete Asset"
        message="Are you sure you want to delete this asset lot? This action cannot be undone."
      />
    </>
  );
};
