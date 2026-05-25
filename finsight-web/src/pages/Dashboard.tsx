
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardView } from '../features/dashboard/DashboardView';
import { financeService } from '../features/finance/financeService';
import { useFinance } from '../contexts/FinanceContext';
import { Transaction, Asset, AIInsight, GroupedAsset } from '../types';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { totals } = useFinance();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [groupedAssets, setGroupedAssets] = useState<GroupedAsset[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await financeService.getDashboardData();
        setTransactions(data.recentTransactions);
        setAssets([]); // Assets list isn't strictly needed if we have groupedAssets, but keeping type compatibility
        setGroupedAssets(data.groupedAssets);
        setInsights(data.insights);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

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
