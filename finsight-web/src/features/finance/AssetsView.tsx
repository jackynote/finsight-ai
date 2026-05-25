
import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Asset, GroupedAsset } from '../../types';
import { financeService } from './financeService';
import { calculateGroupedAssets } from './financeUtils';

interface AssetsViewProps {
  onOpenModal: (type: 'asset' | 'updatePrice' | 'assetDetails') => void;
  onSelectGroup: (group: GroupedAsset) => void;
}

export const AssetsView: React.FC<AssetsViewProps> = ({ onOpenModal, onSelectGroup }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAssets = async () => {
      setIsLoading(true);
      try {
        const data = await financeService.getAssets();
        setAssets(data);
      } catch (error) {
        console.error("Error fetching assets:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssets();
  }, []);

  const groupedAssets = useMemo(() => calculateGroupedAssets(assets), [assets]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <div key={i} className="bg-slate-50 h-64 rounded-3xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {groupedAssets.map((group) => (
        <div key={group.key} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="cursor-pointer group" onClick={() => { onSelectGroup(group); onOpenModal('assetDetails'); }}>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 group-hover:text-slate-600 transition-colors">
                {group.currencyCode}
              </h3>
              <p className="text-xs text-slate-500 font-bold uppercase">
                {group.totalQuantity.toLocaleString(undefined, { maximumFractionDigits: 6 })} Units · {group.lots.length} {group.lots.length === 1 ? 'lot' : 'lots'}
              </p>
            </div>
            <button onClick={() => { onSelectGroup(group); onOpenModal('updatePrice'); }} className="p-2 text-slate-400 hover:text-slate-900 bg-slate-50 rounded-xl transition-colors">
              <RefreshCw size={18} />
            </button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-3 text-xs text-slate-500">
            <div>
              <p className="uppercase font-bold">Rate</p>
              <p className="text-slate-900 font-semibold">${group.currentRateUsd.toLocaleString(undefined, { maximumFractionDigits: 6 })}</p>
            </div>
            <div>
              <p className="uppercase font-bold">Avg Cost</p>
              <p className="text-slate-900 font-semibold">${group.avgPurchasePriceUsd.toLocaleString(undefined, { maximumFractionDigits: 6 })}</p>
            </div>
          </div>
          <div className="mt-6 flex items-end justify-between">
            <div>
              <p className="text-sm text-slate-500">Value</p>
              <p className="text-2xl font-bold">${group.currentValueUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            </div>
            <div className={`text-right font-bold flex items-center gap-1 ${group.gainUsd >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {group.gainUsd >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {Math.abs(group.gainPercent).toFixed(1)}%
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
