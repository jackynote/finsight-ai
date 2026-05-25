
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardView } from '../features/dashboard/DashboardView';
import { financeService } from '../features/finance/financeService';
import { calculateGroupedAssets } from '../features/finance/financeUtils';
import { useFinance } from '../contexts/FinanceContext';
import { Transaction, Asset, AIInsight } from '../types';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { totals } = useFinance();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [txs, asts, { insights: aiInsights }] = await Promise.all([
          financeService.getTransactions(),
          financeService.getAssets(),
          financeService.getAiInsights(),
        ]);
        setTransactions(txs);
        setAssets(asts);
        setInsights(aiInsights);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const groupedAssets = useMemo(() => calculateGroupedAssets(assets), [assets]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading dashboard...</div>;
  }

  return (
    <DashboardView 
      totals={totals}
      transactions={transactions}
      assets={assets}
      groupedAssets={groupedAssets}
      insights={insights}
      setActiveTab={(tab) => navigate(`/${tab}`)}
    />
  );
};

export default DashboardPage;
