import React from 'react';
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  Bell, 
  Building2, 
  Award, 
  TrendingUp, 
  Package, 
  FileText, 
  HardDrive,
  PieChart,
  Banknote,
  ArrowRightLeft,
  BarChart3,
  Folder,
  Link as LinkIcon,
  StickyNote
} from 'lucide-react';
import { Asset, TimeFrame, ViewType } from '@/types/admin';

export const calculateDepreciation = (asset: Asset): number => {
  const age = (new Date().getTime() - new Date(asset.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
  
  if (asset.depreciationMethod === 'straight-line') {
    const annualDepreciation = (asset.purchasePrice - asset.salvageValue) / asset.usefulLife;
    const totalDepreciation = Math.min(annualDepreciation * age, asset.purchasePrice - asset.salvageValue);
    return Math.max(0, asset.purchasePrice - totalDepreciation);
  } else if (asset.depreciationMethod === 'declining') {
    const rate = 2 / asset.usefulLife;
    let value = asset.purchasePrice;
    for (let i = 0; i < Math.floor(age); i++) {
      value = value * (1 - rate);
    }
    return Math.max(value, asset.salvageValue);
  }
  
  return asset.currentValue;
};

export const calculateAssetTotals = (assets: Asset[]) => {
  const totalOriginalValue = assets.reduce((sum, a) => sum + a.purchasePrice, 0);
  const totalCurrentValue = assets.reduce((sum, a) => sum + calculateDepreciation(a), 0);
  const totalDepreciation = totalOriginalValue - totalCurrentValue;
  
  return {
    totalOriginalValue,
    totalCurrentValue,
    totalDepreciation,
    byCategory: {
      fixed: assets.filter(a => a.category === 'fixed').reduce((sum, a) => sum + calculateDepreciation(a), 0),
      intangible: assets.filter(a => a.category === 'intangible').reduce((sum, a) => sum + calculateDepreciation(a), 0),
      investment: assets.filter(a => a.category === 'investment').reduce((sum, a) => sum + calculateDepreciation(a), 0),
      inventory: assets.filter(a => a.category === 'inventory').reduce((sum, a) => sum + calculateDepreciation(a), 0),
      lease: assets.filter(a => a.category === 'lease').reduce((sum, a) => sum + calculateDepreciation(a), 0)
    }
  };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};

export const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const formatDate = (dateString: string | null): string => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'critical': return 'text-red-600 bg-red-50 border-red-200';
    case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export const getSeverityIcon = (severity: string): React.ReactNode => {
  switch (severity) {
    case 'critical': return <AlertTriangle className="w-5 h-5" />;
    case 'warning': return <AlertCircle className="w-5 h-5" />;
    case 'info': return <Info className="w-5 h-5" />;
    default: return <Bell className="w-5 h-5" />;
  }
};

export const getAssetIcon = (category: string): React.ReactNode => {
  switch (category) {
    case 'fixed': return <Building2 className="w-5 h-5" />;
    case 'intangible': return <Award className="w-5 h-5" />;
    case 'investment': return <TrendingUp className="w-5 h-5" />;
    case 'inventory': return <Package className="w-5 h-5" />;
    case 'lease': return <FileText className="w-5 h-5" />;
    default: return <HardDrive className="w-5 h-5" />;
  }
};

export const getAssetCategoryColor = (category: string): string => {
  switch (category) {
    case 'fixed': return 'bg-blue-100 text-blue-700';
    case 'intangible': return 'bg-purple-100 text-purple-700';
    case 'investment': return 'bg-green-100 text-green-700';
    case 'inventory': return 'bg-orange-100 text-orange-700';
    case 'lease': return 'bg-pink-100 text-pink-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

export const timeFrameOptions: { value: TimeFrame; label: string }[] = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: '12m', label: 'Last 12 Months' },
  { value: 'ytd', label: 'Year to Date' },
  { value: 'all', label: 'All Time' }
];

export const viewOptions: { value: ViewType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'overview', label: 'Overview', icon: PieChart },
  { value: 'treasury', label: 'Treasury', icon: Banknote },
  { value: 'assets', label: 'Assets', icon: Building2 },
  { value: 'transactions', label: 'AP/AR', icon: ArrowRightLeft },
  { value: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
  { value: 'alerts', label: 'Alerts', icon: Bell },
  { value: 'documents', label: 'Documents', icon: Folder },
  { value: 'integrations', label: 'Integrations', icon: LinkIcon },
  { value: 'notes', label: 'Notes & Tasks', icon: StickyNote }
];
