
export interface User {
  id: string;
  email: string;
  name: string;
  defaultCurrency?: string;
  role: 'ADMIN' | 'USER';
}

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense'
}

export interface TransactionCategory {
  id: string;
  code: string;
  value: string;
  created_at?: string;
  updated_at?: string;
}

export interface Transaction {
  id: string;
  date: string;
  created_at?: string;
  amount: number;
  currency_id?: string;
  currency?: Currency;
  category_code: string;
  category?: TransactionCategory;
  description: string;
  type: TransactionType;
}

export interface CreateTransactionInput {
  date?: string;
  amount: number;
  category_code: string;
  description?: string;
  type: TransactionType;
  currency_id?: string;
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
  pair: string;
  base_currency_code: string;
  quote_currency_code: string;
  ratio: number;
  is_auto_update: boolean;
  platform?: string | null;
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

export type DashboardPeriod = '30' | '60' | 'all';

export interface FinanceTotals {
  income: number;
  expenses: number;
  balance: number;
  assetValue: number;
  assetGain: number;
  netWorth: number;
  currencySymbol?: string;
  currencyCode?: string;
}
