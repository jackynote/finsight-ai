
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Currency } from '../types';
import { financeService } from '../features/finance/financeService';

interface FinanceTotals {
  income: number;
  expenses: number;
  balance: number;
  assetValue: number;
  assetGain: number;
  netWorth: number;
}

interface FinanceContextType {
  totals: FinanceTotals;
  currencies: Currency[];
  isLoadingGlobal: boolean;
  refreshTotals: () => Promise<void>;
  refreshCurrencies: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [totals, setTotals] = useState<FinanceTotals>({
    income: 0,
    expenses: 0,
    balance: 0,
    assetValue: 0,
    assetGain: 0,
    netWorth: 0,
  });
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(false);

  const refreshTotals = useCallback(async () => {
    setIsLoadingGlobal(true);
    try {
      const computedTotals = await financeService.getTotals();
      setTotals(computedTotals);
    } catch (error) {
      console.error('Error refreshing totals:', error);
    } finally {
      setIsLoadingGlobal(false);
    }
  }, []);

  const refreshCurrencies = useCallback(async () => {
    try {
      const curs = await financeService.getCurrencies();
      setCurrencies(curs);
    } catch (error) {
      console.error('Error refreshing currencies:', error);
    }
  }, []);

  useEffect(() => {
    refreshCurrencies();
    refreshTotals();
  }, [refreshCurrencies, refreshTotals]);

  const value = useMemo(() => ({
    totals,
    currencies,
    isLoadingGlobal,
    refreshTotals,
    refreshCurrencies,
  }), [totals, currencies, isLoadingGlobal, refreshTotals, refreshCurrencies]);

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};
