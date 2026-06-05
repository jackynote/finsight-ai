
import React, { useState, useEffect } from 'react';
import { GroupedAsset, Currency } from '../types';
import { financeService } from '../features/finance/financeService';
import { useFinance } from '../contexts/FinanceContext';
import { useAuth } from '../contexts/AuthContext';
import { Modals } from '../components/common/Modals';

const AssetsPage: React.FC = () => {
  const { refreshTotals, currencies, refreshCurrencies, totals } = useFinance();
  const { user } = useAuth();
  const [groupedAssets, setGroupedAssets] = useState<GroupedAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState<'asset' | 'assetDetails' | ''>('');
  const [selectedGroup, setSelectedGroup] = useState<GroupedAsset | null>(null);

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const data = await financeService.getGroupedAssets();
      setGroupedAssets(data.groupedAssets);
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
    const purchaseCurrency =
      currencies.find((c) => c.code === (user?.defaultCurrency || 'USD')) ||
      currencies.find((c) => c.code === 'USD');
    const data = {
      date: new Date().toISOString().split('T')[0],
      name: currency.code,
      category: currency.type,
      currency_id: currency.id,
      purchase_price: purchasePrice,
      purchase_currency_id: purchaseCurrency?.id,
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

  const handleDeleteAsset = async (id: string) => {
    try {
      await financeService.deleteAsset(id);
      const data = await financeService.getGroupedAssets();
      setGroupedAssets(data.groupedAssets);
      await refreshTotals();
      
      // Update selectedGroup to reflect deletion or close modal if group is empty
      if (selectedGroup) {
        const updatedGroup = data.groupedAssets.find((g: GroupedAsset) => g.key === selectedGroup.key);
        
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
          <button
            key={group.key}
            type="button"
            onClick={() => { setSelectedGroup(group); setIsModalOpen('assetDetails'); }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all text-left w-full"
          >
            <div className="mb-4">
              <div className="group">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 group-hover:text-slate-600 transition-colors">
                  {group.currencyCode}
                </h3>
                <p className="text-xs text-slate-500 font-bold uppercase">
                  {group.totalQuantity.toLocaleString(undefined, { maximumFractionDigits: 6 })} Units · {group.lots.length} {group.lots.length === 1 ? 'lot' : 'lots'}
                </p>
              </div>
            </div>
            
            <div className="mt-2 grid grid-cols-2 gap-3 text-xs text-slate-500">
              <div>
                <p className="font-bold uppercase opacity-60">Avg. Buy</p>
                <p className="text-sm font-bold text-slate-900">{totals.currencySymbol || '$'}{group.avgPurchasePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              </div>
              <div className="text-right">
                <p className="font-bold uppercase opacity-60">Market Value</p>
                <p className="text-sm font-bold text-slate-900">{totals.currencySymbol || '$'}{group.currentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="font-bold uppercase opacity-60">Profit/Loss</p>
                <p className={`text-sm font-bold ${group.gain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {group.gain >= 0 ? '+' : ''}{totals.currencySymbol || '$'}{Math.abs(group.gain).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold uppercase opacity-60">Return</p>
                <p className={`text-sm font-bold ${group.gainPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {group.gainPercent >= 0 ? '+' : ''}{group.gainPercent.toFixed(2)}%
                </p>
              </div>
            </div>
          </button>
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
          displayCurrencyCode={totals.currencyCode || user?.defaultCurrency || 'USD'}
          displayCurrencySymbol={totals.currencySymbol || '$'}
        />
      )}
    </div>
  );
};

export default AssetsPage;
