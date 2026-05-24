import api from '../../api/api';
import { Transaction, Asset } from '../../types';

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
};
