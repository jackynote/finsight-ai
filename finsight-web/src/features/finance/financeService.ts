
import api from '../../api/api';
import { Transaction, Asset, Currency, CurrencyRate } from '../../types';

export const financeService = {
  // Transactions
  getTransactions: async (): Promise<Transaction[]> => {
    const response = await api.get('/transactions');
    return response.data;
  },
  createTransaction: async (data: Omit<Transaction, 'id'>): Promise<Transaction> => {
    const response = await api.post('/transactions', data);
    return response.data;
  },
  deleteTransaction: async (id: string): Promise<void> => {
    await api.delete(`/transactions/${id}`);
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
  updateAsset: async (id: string, data: Partial<Asset>): Promise<Asset> => {
    const response = await api.patch(`/assets/${id}`, data);
    return response.data;
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
  updateCurrencyRate: async (code: string, rate_to_usd: number): Promise<CurrencyRate> => {
    const response = await api.patch(`/currencies/${code}/rate`, { rate_to_usd });
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
  getDashboardData: async (): Promise<any> => {
    const response = await api.get('/finance/dashboard');
    return response.data;
  },
};
