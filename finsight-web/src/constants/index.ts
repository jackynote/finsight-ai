
import { Transaction, TransactionType, Asset } from '../types';

export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', date: '2024-03-01', amount: 5000, category: 'Salary', description: 'Monthly paycheck', type: TransactionType.INCOME },
  { id: '2', date: '2024-03-02', amount: 1200, category: 'Rent', description: 'March Rent', type: TransactionType.EXPENSE },
  { id: '3', date: '2024-03-04', amount: 85.50, category: 'Groceries', description: 'Whole Foods', type: TransactionType.EXPENSE },
  { id: '4', date: '2024-03-05', amount: 45.00, category: 'Dining Out', description: 'Pizza Night', type: TransactionType.EXPENSE },
  { id: '5', date: '2024-03-07', amount: 120.00, category: 'Utilities', description: 'Electricity Bill', type: TransactionType.EXPENSE },
];

export const INITIAL_ASSETS: Asset[] = [
  { id: 'a1', name: 'Bitcoin', category: 'Crypto', purchase_price: 42000, current_price: 64000, quantity: 0.1, date: '2023-10-12' },
  { id: 'a2', name: 'Apple Inc.', category: 'Stocks', purchase_price: 150, current_price: 185, quantity: 10, date: '2023-11-05' },
];

export const COLORS = ['#0f172a', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
