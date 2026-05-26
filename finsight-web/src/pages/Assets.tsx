
import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { Asset, GroupedAsset, Currency } from '../types';
import { financeService } from '../features/finance/financeService';
import { calculateGroupedAssets } from '../features/finance/financeUtils';
import { useFinance } from '../contexts/FinanceContext';
import { Modals } from '../components/common/Modals';

const AssetsPage: React.FC = () => {
  const { refreshTotals, currencies, refreshCurrencies, totals } = useFinance();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState<'asset' | 'updatePrice' | 'assetDetails' | ''>('');
  const [selectedGroup, setSelectedGroup] = useState<GroupedAsset | null>(null);

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const asts = await financeService.getAssets();
      setAssets(asts);
    } catch (error) {
      console.error("Error fetching assets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
    if (currencies.length === 0) {
      refreshCurrencies();
    }
  }, []);

  const groupedAssets = useMemo(() => calculateGroupedAssets(assets), [assets]);

  const handleAssetSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const currencyId = formData.get('currency_id') as string;
    const currency = currencies.find((c) => c.id === currencyId);
    if (!currency) {
      console.error('Currency not selected');
      return;
    }
    const purchasePrice = Number(formData.get('purchasePrice'));
    const data = {
      date: new Date().toISOString().split('T')[0],
      name: currency.code,
      category: currency.type,
      currency_id: currency.id,
      purchase_price: purchasePrice,
      current_price: purchasePrice,
      quantity: Number(formData.get('quantity')),
    };
    try {
      // @ts-ignore - Backend use snake_case for some fields
      await financeService.createAsset(data);
      await fetchAssets();
      await refreshTotals();
      setIsModalOpen('');
    } catch (error) {
      console.error("Error creating asset:", error);
    }
  };

  const handleUpdatePrice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedGroup) return;
    const formData = new FormData(e.currentTarget);
    const newRate = Number(formData.get('currentPrice'));
    try {
      if (selectedGroup.lots[0]?.currency_id) {
        await financeService.updateCurrencyRate(selectedGroup.currencyCode, newRate);
      } else {
        await Promise.all(
          selectedGroup.lots.map((lot) =>
            financeService.updateAsset(lot.id, { current_price: newRate }),
          ),
        );
      }
      await fetchAssets();
      await refreshTotals();
      setIsModalOpen('');
      setSelectedGroup(null);
    } catch (error) {
      console.error('Error updating rate:', error);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    try {
      await financeService.deleteAsset(id);
      const updatedAssets = await financeService.getAssets();
      setAssets(updatedAssets);
      await refreshTotals();
      
      // Update selectedGroup to reflect deletion or close modal if group is empty
      if (selectedGroup) {
        const newGroupedAssets = calculateGroupedAssets(updatedAssets);
        const updatedGroup = newGroupedAssets.find(g => g.key === selectedGroup.key);
        
        if (!updatedGroup) {
          setIsModalOpen('');
          setSelectedGroup(null);
        } else {
          setSelectedGroup(updatedGroup);
        }
      }
    } catch (error) {
      console.error('Error deleting asset:', error);
    }
  };

  const handleModalSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (isModalOpen === 'asset') handleAssetSubmit(e);
    if (isModalOpen === 'updatePrice') handleUpdatePrice(e);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading assets...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <button 
          onClick={() => setIsModalOpen('asset')} 
          className="bg-slate-900 text-white px-5 py-3 rounded-2xl font-semibold flex items-center gap-2 shadow-md hover:bg-slate-800 transition-all"
        >
          Add Asset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groupedAssets.map((group) => (
          <div key={group.key} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="cursor-pointer group" onClick={() => { setSelectedGroup(group); setIsModalOpen('assetDetails'); }}>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 group-hover:text-slate-600 transition-colors">
                  {group.currencyCode}
                </h3>
                <p className="text-xs text-slate-500 font-bold uppercase">
                  {group.totalQuantity.toLocaleString(undefined, { maximumFractionDigits: 6 })} Units · {group.lots.length} {group.lots.length === 1 ? 'lot' : 'lots'}
                </p>
              </div>
              <button onClick={() => { setSelectedGroup(group); setIsModalOpen('updatePrice'); }} className="p-2 text-slate-400 hover:text-slate-900 bg-slate-50 rounded-xl transition-colors">
                <RefreshCw size={18} />
              </button>
            </div>
            
            <div className="mt-2 grid grid-cols-2 gap-3 text-xs text-slate-500">
              <div>
                <p className="font-bold uppercase opacity-60">Avg. Buy</p>
                <p className="text-sm font-bold text-slate-900">{totals.currencySymbol || '$'}{group.avgPurchasePriceUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              </div>
              <div className="text-right">
                <p className="font-bold uppercase opacity-60">Market Value</p>
                <p className="text-sm font-bold text-slate-900">{totals.currencySymbol || '$'}{group.currentValueUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="font-bold uppercase opacity-60">Profit/Loss</p>
                <p className={`text-sm font-bold ${group.gainUsd >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {group.gainUsd >= 0 ? '+' : ''}{totals.currencySymbol || '$'}{Math.abs(group.gainUsd).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold uppercase opacity-60">Return</p>
                <p className={`text-sm font-bold ${group.gainPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {group.gainPercent >= 0 ? '+' : ''}{group.gainPercent.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <Modals 
          isModalOpen={isModalOpen}
          onClose={() => setIsModalOpen('')}
          onSubmit={handleModalSubmit}
          onDeleteAsset={handleDeleteAsset}
          selectedGroup={selectedGroup}
          currencies={currencies}
        />
      )}
    </div>
  );
};

export default AssetsPage;
