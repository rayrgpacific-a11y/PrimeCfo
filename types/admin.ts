export interface ClientQBOConnection {
  company_id: string;
  customer_id: string;
  sync_enabled: boolean;
  status: string;
}

export interface Client {
  client_id: string;
  client_name: string;
  company_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  tags: string[];
  notes?: string;
  client_qbo_connections?: ClientQBOConnection[];
}

export type AssetCategory = 'fixed' | 'intangible' | 'investment' | 'inventory' | 'lease';
export type DepreciationMethod = 'straight-line' | 'declining' | 'units' | 'none';
export type AssetStatus = 'active' | 'disposed' | 'impaired' | 'under-maintenance';

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  subcategory: string;
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  depreciationMethod: DepreciationMethod;
  usefulLife: number; // in years
  salvageValue: number;
  location?: string;
  serialNumber?: string;
  vendor?: string;
  warranty?: string;
  status: AssetStatus;
  notes?: string;
}

export interface QuickBooksInvoice {
  id: string;
  amount: number;
  balance: number;
  dueDate: string;
  date: string;
}

export interface QuickBooksData {
  customer: {
    id: string;
    name: string;
    balance: number;
    email?: string;
    phone?: string;
    active: boolean;
  };
  invoices: {
    total: number;
    totalAmount: number;
    overdueAmount: number;
    recentInvoices: QuickBooksInvoice[];
  };
  payments: {
    lastPaymentDate: string | null;
    lastPaymentAmount: number;
  };
  expenses?: {
    total: number;
    totalAmount: number;
    categories: { [key: string]: number };
  };
  profitLoss?: {
    revenue: number;
    expenses: number;
    netIncome: number;
  };
  treasury?: {
    totalCash: number;
    accountBalances: AccountBalance[];
  };
  fixedAssets?: Asset[];
  kpis?: {
    grossMargin: number;
    netMargin: number;
    burnRate: number;
    runway: number;
  };
  company?: {
    id: string;
    legalName: string;
  };
  status: string;
}

export interface AccountBalance {
  bank: string;
  accountName: string;
  balance: number;
  available: number;
  currency: string;
}

export interface CreditLine {
  lender: string;
  limit: number;
  used: number;
  available: number;
  rate: number;
}

export interface UpcomingTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'inflow' | 'outflow';
}

export interface TreasuryData {
  totalCash: number;
  accountBalances: AccountBalance[];
  cashFlow: {
    inflows: number;
    outflows: number;
    net: number;
  };
  creditLines: CreditLine[];
  upcomingTransactions: UpcomingTransaction[];
}

export interface AnalyticsData {
  kpis: {
    grossMargin: number;
    netMargin: number;
    currentRatio: number;
    quickRatio: number;
    dso: number;
    dpo: number;
    burnRate: number;
    runway: number;
  };
  trends: {
    revenue: Array<{ month: string; value: number }>;
    expenses: Array<{ month: string; value: number }>;
  };
  budgetVariance: {
    revenue: { actual: number; budget: number; variance: number };
    expenses: { actual: number; budget: number; variance: number };
  };
}

export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  title: string;
  description: string;
  actionRequired: boolean;
  timestamp: string;
}

export type TimeFrame = '7d' | '30d' | '90d' | '12m' | 'ytd' | 'all';
export type ViewType = 'overview' | 'treasury' | 'assets' | 'transactions' | 'analytics' | 'documents' | 'alerts' | 'integrations' | 'notes';
