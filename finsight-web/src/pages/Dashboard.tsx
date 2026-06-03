
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardView } from '../features/dashboard/DashboardView';
import { financeService } from '../features/finance/financeService';
import { useFinance } from '../contexts/FinanceContext';
import { Transaction, AIInsight, GroupedAsset, DashboardPeriod, FinanceTotals } from '../types';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { totals } = useFinance();
  const [period, setPeriod] = useState<DashboardPeriod>('30');
  const [dashboardTotals, setDashboardTotals] = useState<FinanceTotals>(totals);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [groupedAssets, setGroupedAssets] = useState<GroupedAsset[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await financeService.getDashboardData(period);
        setDashboardTotals(data.totals);
        setTransactions(data.recentTransactions);
        setGroupedAssets(data.groupedAssets);
        setInsights(data.insights);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [period]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading dashboard...</div>;
  }

  return (
    <DashboardView 
      totals={totals}
      dashboardTotals={dashboardTotals}
      transactions={transactions}
      groupedAssets={groupedAssets}
      insights={insights}
      period={period}
      onPeriodChange={setPeriod}
      setActiveTab={(tab) => navigate(`/${tab}`)}
    />
  );
};

export default DashboardPage;
