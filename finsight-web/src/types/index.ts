
export interface User {
  id: string;
  email: string;
  name: string;
}

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense'
}

export enum TransactionCategory {
  FOOD_DRINK = 'FOOD_DRINK',
  SHOPPING = 'SHOPPING',
  HOUSING = 'HOUSING',
  TRANSPORTATION = 'TRANSPORTATION',
  ENTERTAINMENT = 'ENTERTAINMENT',
  HEALTH = 'HEALTH',
  INVESTMENT = 'INVESTMENT',
  INCOME = 'INCOME',
  OTHERS = 'OTHERS',
}

export interface Transaction {
  id: string;
  date: string;
  created_at?: string;
  amount: number;
  category: TransactionCategory;
  description: string;
  type: TransactionType;
}

export interface Budget {
  category: string;
  limit: number;
  spent: number;
}

export interface AIInsight {
  title: string;
  content: string;
  type: 'success' | 'warning' | 'info';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  action?: ChatAction;
}

export interface ChatAction {
  type: 'ADD_TRANSACTION' | 'SHOW_INSIGHTS' | 'UPDATE_ASSET' | 'NONE';
  data?: any;
}

export enum AssetCategory {
  FIAT = 'FIAT',
  GOLD = 'GOLD',
  CRYPTO = 'CRYPTO',
  STOCK = 'STOCK',
  REAL_ESTATE = 'REAL_ESTATE',
  OTHER = 'OTHER'
}

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  purchase_price: number;
  current_price: number;
  quantity: number;
  date: string;
  created_at?: string;
}
