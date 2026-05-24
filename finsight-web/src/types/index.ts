
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

export interface CurrencyRate {
  id: string;
  currency_id: string;
  rate_to_usd: number;
  created_at?: string;
  updated_at?: string;
}

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol?: string;
  type: AssetCategory;
  rates?: CurrencyRate[];
  created_at?: string;
  updated_at?: string;
}

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  currency_id?: string;
  currency?: Currency;
  purchase_price: number;
  current_price: number;
  quantity: number;
  date: string;
  created_at?: string;
}

export interface GroupedAsset {
  key: string;
  currencyCode: string;
  currencySymbol?: string;
  name: string;
  category: AssetCategory;
  totalQuantity: number;
  currentRateUsd: number;
  currentValueUsd: number;
  totalPurchaseValueUsd: number;
  avgPurchasePriceUsd: number;
  gainUsd: number;
  gainPercent: number;
  lots: Asset[];
}
