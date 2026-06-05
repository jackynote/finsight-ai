
import api from '../../api/api';
import {
  Transaction,
  Asset,
  Currency,
  CurrencyRate,
  TransactionCategory,
  CreateTransactionInput,
  DashboardPeriod,
} from '../../types';

export const financeService = {
  // Transactions
  getTransactions: async (): Promise<Transaction[]> => {
    const response = await api.get('/transactions');
    return response.data;
  },
  createTransaction: async (data: CreateTransactionInput): Promise<Transaction> => {
    const response = await api.post('/transactions', data);
    return response.data;
  },
  updateTransaction: async (id: string, data: Partial<CreateTransactionInput>): Promise<Transaction> => {
    const response = await api.patch(`/transactions/${id}`, data);
    return response.data;
  },
  deleteTransaction: async (id: string): Promise<void> => {
    await api.delete(`/transactions/${id}`);
  },
  getTransactionCategories: async (): Promise<TransactionCategory[]> => {
    const response = await api.get('/transaction-categories');
    return response.data;
  },

  // Assets
  getAssets: async (): Promise<Asset[]> => {
    const response = await api.get('/assets');
    return response.data;
  },
  createAsset: async (data: Omit<Asset, 'id'>): Promise<Asset> => {
    const response = await api.post('/assets', data);
    return response.data;
  },
  deleteAsset: async (id: string): Promise<void> => {
    await api.delete(`/assets/${id}`);
  },

  // Currencies
  getCurrencies: async (): Promise<Currency[]> => {
    const response = await api.get('/currencies');
    return response.data;
  },
  getCurrency: async (code: string): Promise<Currency> => {
    const response = await api.get(`/currencies/${code}`);
    return response.data;
  },
  getCurrencyRates: async (): Promise<CurrencyRate[]> => {
    const response = await api.get('/currencies/rates');
    return response.data;
  },
  upsertCurrencyRateByPair: async (
    pair: string,
    data: Pick<CurrencyRate, 'ratio'> & Partial<Pick<CurrencyRate, 'is_auto_update' | 'platform'>>,
  ): Promise<CurrencyRate> => {
    const response = await api.patch(`/currencies/rates/${pair}`, data);
    return response.data;
  },

  // AI Insights
  getAiInsights: async (): Promise<{ insights: any[] }> => {
    const response = await api.get('/ai/insights');
    return response.data;
  },

  // Finance
  getTotals: async (): Promise<any> => {
    const response = await api.get('/finance/totals');
    return response.data;
  },
  getGroupedAssets: async (): Promise<any> => {
    const response = await api.get('/finance/assets');
    return response.data;
  },
  getDashboardData: async (period: DashboardPeriod = '30'): Promise<any> => {
    const response = await api.get('/finance/dashboard', { params: { period } });
    return response.data;
  },
};
