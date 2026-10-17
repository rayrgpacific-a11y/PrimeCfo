'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { 
  RefreshCw, 
  Users, 
  Plus, 
  Building, 
  ArrowRight, 
  ShieldCheck, 
  Loader2, 
  AlertTriangle, 
  Link2, 
  X, 
  Calendar, 
  ChevronDown, 
  Download, 
  Check 
} from 'lucide-react';
import AdminAuth from '@/components/admin/AdminAuth';
import AdminPortalShell from '@/components/admin/dashboard/AdminPortalShell';
import AssetModal from '@/components/admin/dashboard/modals/AssetModal';
import OverviewTab from '@/components/admin/dashboard/tabs/OverviewTab';
import TreasuryTab from '@/components/admin/dashboard/tabs/TreasuryTab';
import AssetsTab from '@/components/admin/dashboard/tabs/AssetsTab';
import TransactionsTab from '@/components/admin/dashboard/tabs/TransactionsTab';
import AnalyticsTab from '@/components/admin/dashboard/tabs/AnalyticsTab';
import DocumentsTab from '@/components/admin/dashboard/tabs/DocumentsTab';
import AlertsTab from '@/components/admin/dashboard/tabs/AlertsTab';
import IntegrationsTab from '@/components/admin/dashboard/tabs/IntegrationsTab';
import NotesTab from '@/components/admin/dashboard/tabs/NotesTab';

import { 
  Client, 
  Asset, 
  QuickBooksData, 
  TreasuryData, 
  AnalyticsData, 
  Alert, 
  TimeFrame, 
  ViewType 
} from '@/types/admin';
import { calculateAssetTotals, timeFrameOptions } from '@/lib/admin-utils';
import { DEFAULT_SAMPLE_CLIENTS, getSampleQuickBooksData } from '@/data/admin-mock-data';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function CFOClientDashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  return (
    <AdminAuth>
      <DashboardContent 
        clients={clients}
        setClients={setClients}
        selectedClient={selectedClient}
        setSelectedClient={setSelectedClient}
        loading={loading}
        setLoading={setLoading}
      />
    </AdminAuth>
  );
}

function DashboardContent({
  clients,
  setClients,
  selectedClient,
  setSelectedClient,
  loading,
  setLoading
}: {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  selectedClient: Client | null;
  setSelectedClient: React.Dispatch<React.SetStateAction<Client | null>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [qbData, setQbData] = useState<QuickBooksData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('30d');
  const [activeView, setActiveView] = useState<ViewType>('overview');
  const [showDropdown, setShowDropdown] = useState(false);
  const [rangeDropdownOpen, setRangeDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [qbAlertDismissed, setQbAlertDismissed] = useState(false);
  const [notes, setNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  
  // Assets state
  const [assets, setAssets] = useState<Asset[]>([]);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [assetFormData, setAssetFormData] = useState<Partial<Asset>>({
    category: 'fixed',
    depreciationMethod: 'straight-line',
    status: 'active',
    usefulLife: 5,
    salvageValue: 0
  });

  // CFO Treasury Data
  const [treasuryData, setTreasuryData] = useState<TreasuryData>({
    totalCash: 0,
    accountBalances: [],
    cashFlow: {
      inflows: 520000,
      outflows: 380000,
      net: 140000
    },
    creditLines: [
      { lender: 'Chase Commercial', limit: 500000, used: 150000, available: 350000, rate: 7.5 },
      { lender: 'Wells Fargo Revolver', limit: 250000, used: 0, available: 250000, rate: 8.0 }
    ],
    upcomingTransactions: [
      { date: '2024-11-15', description: 'Enterprise Inflow - Inv #1042', amount: 85000, type: 'inflow' },
      { date: '2024-11-16', description: 'Mid-Month Payroll Run', amount: 125000, type: 'outflow' },
      { date: '2024-11-18', description: 'Vendor Payment - Cloud Hosting', amount: 32000, type: 'outflow' },
      { date: '2024-11-20', description: 'Retainer Deposit - Client #1043', amount: 95000, type: 'inflow' }
    ]
  });

  // Analytics KPI & variance data
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    kpis: {
      grossMargin: 42.5,
      netMargin: 18.3,
      currentRatio: 2.1,
      quickRatio: 1.8,
      dso: 45,
      dpo: 30,
      burnRate: 280000,
      runway: 10.2
    },
    trends: {
      revenue: [
        { month: 'Jul', value: 420000 },
        { month: 'Aug', value: 485000 },
        { month: 'Sep', value: 520000 },
        { month: 'Oct', value: 510000 },
        { month: 'Nov', value: 495000 }
      ],
      expenses: [
        { month: 'Jul', value: 350000 },
        { month: 'Aug', value: 380000 },
        { month: 'Sep', value: 365000 },
        { month: 'Oct', value: 390000 },
        { month: 'Nov', value: 380000 }
      ]
    },
    budgetVariance: {
      revenue: { actual: 2430000, budget: 2500000, variance: -2.8 },
      expenses: { actual: 1865000, budget: 1800000, variance: 3.6 }
    }
  });

  // Alerts data
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      severity: 'critical',
      category: 'Cash Horizon',
      title: 'Target Cash Threshold Alert',
      description: 'Projected net balance will approach working capital threshold within 14 days.',
      actionRequired: true,
      timestamp: '2024-11-14T10:30:00'
    },
    {
      id: '2',
      severity: 'warning',
      category: 'Collections',
      title: 'Invoice Aging > 30 Days',
      description: 'Invoice #1040 ($85,000) is past due date for Acme subsidiary.',
      actionRequired: true,
      timestamp: '2024-11-14T09:15:00'
    },
    {
      id: '3',
      severity: 'info',
      category: 'General Ledger',
      title: 'Intuit QBO Automatic Sync Verified',
      description: 'Chart of accounts and customer ledger reconciliation synchronized.',
      actionRequired: false,
      timestamp: '2024-11-14T08:00:00'
    }
  ]);

  // Fetch real assets from database scoped to current client
  const fetchAssets = async (clientId: string): Promise<Asset[]> => {
    try {
      const response = await fetch(`/api/assets?clientId=${encodeURIComponent(clientId)}`);
      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          setAssets(result.data);
          return result.data as Asset[];
        }
      }
      setAssets([]);
      return [];
    } catch (error) {
      console.error('Error fetching assets from database:', error);
      setAssets([]);
      return [];
    }
  };

  useEffect(() => {
    fetchClients();
    
    // Check for OAuth callback parameters
    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get('connected');
    const error = urlParams.get('error');
    
    if (connected === 'true') {
      setTimeout(() => {
        fetchClients();
      }, 500);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error === 'connection_failed') {
      console.error('QuickBooks connection failed');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchClientData(selectedClient);
      fetchAssets(selectedClient.client_id);
      setNotes(selectedClient.notes || '');
    }
  }, [selectedClient, timeFrame]);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (response.ok) {
        const result = await response.json();
        if (result.data && result.data.length > 0) {
          setClients(result.data);
          setSelectedClient(result.data[0]);
          return;
        }
      }
      setClients(DEFAULT_SAMPLE_CLIENTS);
      setSelectedClient(DEFAULT_SAMPLE_CLIENTS[0]);
    } catch (error) {
      console.warn('API clients fetch fell back to demo clients:', error);
      setClients(DEFAULT_SAMPLE_CLIENTS);
      setSelectedClient(DEFAULT_SAMPLE_CLIENTS[0]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientData = async (client: Client) => {
    // If not connected to QBO or using demo client
    if (!client.client_qbo_connections?.[0]) {
      setQbData(getSampleQuickBooksData(client));
      return;
    }

    setRefreshing(true);
    const connection = client.client_qbo_connections[0];
    
    try {
      const response = await fetch(
        `/api/quickbooks/customer?clientId=${client.client_id}&customerId=${connection.customer_id}&companyId=${connection.company_id}&timeFrame=${timeFrame}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setQbData(data);

        // Wire live treasury and cash balances directly from Intuit general ledger
        if (data.treasury) {
          setTreasuryData(prev => ({
            ...prev,
            totalCash: data.treasury.totalCash,
            accountBalances: data.treasury.accountBalances && data.treasury.accountBalances.length > 0 
              ? data.treasury.accountBalances 
              : prev.accountBalances,
            cashFlow: {
              inflows: data.profitLoss?.revenue ?? data.invoices?.totalAmount ?? prev.cashFlow.inflows,
              outflows: data.expenses?.totalAmount ?? prev.cashFlow.outflows,
              net: (data.profitLoss?.revenue ?? data.invoices?.totalAmount ?? prev.cashFlow.inflows) - (data.expenses?.totalAmount ?? prev.cashFlow.outflows)
            }
          }));
        }

        // Wire live financial analytics and real Intuit ratios
        if (data.kpis) {
          setAnalyticsData(prev => ({
            ...prev,
            kpis: {
              ...prev.kpis,
              grossMargin: data.kpis.grossMargin ?? prev.kpis.grossMargin,
              netMargin: data.kpis.netMargin ?? prev.kpis.netMargin,
              burnRate: data.kpis.burnRate ?? prev.kpis.burnRate,
              runway: data.kpis.runway ?? prev.kpis.runway
            },
            budgetVariance: {
              ...prev.budgetVariance,
              revenue: {
                ...prev.budgetVariance.revenue,
                actual: data.invoices?.totalAmount ?? data.profitLoss?.revenue ?? prev.budgetVariance.revenue.actual
              },
              expenses: {
                ...prev.budgetVariance.expenses,
                actual: data.expenses?.totalAmount ?? prev.budgetVariance.expenses.actual
              }
            }
          }));
        }

        // Generate verified alerts based on live QuickBooks invoice status
        if (data.invoices) {
          const overdueInvoices = data.invoices.recentInvoices?.filter((i: any) => i.balance > 0 && new Date(i.dueDate) < new Date()) || [];
          if (data.invoices.overdueAmount > 0) {
            setAlerts([
              {
                id: 'qb-overdue',
                severity: 'warning',
                category: 'Collections',
                title: `Overdue Invoices (${overdueInvoices.length} Past Due)`,
                description: `$${data.invoices.overdueAmount.toLocaleString()} in client invoices requires collections follow-up.`,
                actionRequired: true,
                timestamp: new Date().toISOString()
              },
              {
                id: 'qb-sync',
                severity: 'info',
                category: 'Integration',
                title: 'QuickBooks General Ledger Synchronized',
                description: `Live connection to ${data.company?.legalName || 'QuickBooks Online'} active. Cash position verified at $${data.treasury?.totalCash?.toLocaleString()}.`,
                actionRequired: false,
                timestamp: new Date().toISOString()
              }
            ]);
          } else {
            setAlerts([
              {
                id: 'qb-sync',
                severity: 'info',
                category: 'Integration',
                title: 'QuickBooks General Ledger Synchronized',
                description: `Live connection to ${data.company?.legalName || 'QuickBooks Online'} active. All client invoices in good standing.`,
                actionRequired: false,
                timestamp: new Date().toISOString()
              }
            ]);
          }
        }

        // Auto-seed real QuickBooks GL fixed assets if client connected and asset register is currently empty
        if (data.fixedAssets && data.fixedAssets.length > 0) {
          const currentAssets = await fetchAssets(client.client_id);
          if (currentAssets.length === 0) {
            for (const qbAsset of data.fixedAssets) {
              await fetch('/api/assets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  clientId: client.client_id,
                  name: qbAsset.name,
                  category: qbAsset.category || 'fixed',
                  subcategory: qbAsset.subcategory || 'Commercial Vehicles',
                  purchaseDate: qbAsset.purchaseDate || new Date().toISOString().split('T')[0],
                  purchasePrice: qbAsset.purchasePrice || 0,
                  currentValue: qbAsset.currentValue || qbAsset.purchasePrice || 0,
                  depreciationMethod: qbAsset.depreciationMethod || 'straight-line',
                  usefulLife: qbAsset.usefulLife || 5,
                  salvageValue: qbAsset.salvageValue || 0,
                  location: qbAsset.location || 'On Balance Sheet (QBO GL)',
                  vendor: qbAsset.vendor || 'Intuit QuickBooks',
                  status: 'active',
                  notes: qbAsset.notes || 'Imported from QuickBooks Online General Ledger'
                })
              });
            }
            await fetchAssets(client.client_id);
          }
        }
      } else {
        setQbData(getSampleQuickBooksData(client));
      }
    } catch (error) {
      console.error('Error fetching QB data:', error);
      setQbData(getSampleQuickBooksData(client));
    } finally {
      setRefreshing(false);
    }
  };

  const saveNotes = async () => {
    if (!selectedClient) return;
    
    try {
      await supabase
        .from('clients')
        .update({ notes })
        .eq('client_id', selectedClient.client_id);
      
      setEditingNotes(false);
      setSelectedClient({ ...selectedClient, notes });
    } catch (error) {
      console.error('Error saving notes:', error);
      // In demo mode, still update local state
      setEditingNotes(false);
      setSelectedClient({ ...selectedClient, notes });
    }
  };

  const connectQBFromDashboard = (clientId: string) => {
    window.location.href = `/api/quickbooks/auth?clientId=${clientId}&returnTo=dashboard`;
  };

  const saveAsset = async () => {
    if (!selectedClient) return;
    if (!assetFormData.name?.trim()) {
      alert('Asset name is required');
      return;
    }

    try {
      const isEditing = !!editingAsset?.id;
      const payload = {
        ...(isEditing ? { id: editingAsset.id } : { clientId: selectedClient.client_id }),
        name: assetFormData.name.trim(),
        category: assetFormData.category || 'fixed',
        subcategory: assetFormData.subcategory || '',
        purchaseDate: assetFormData.purchaseDate || new Date().toISOString().split('T')[0],
        purchasePrice: Number(assetFormData.purchasePrice) || 0,
        currentValue: Number(assetFormData.currentValue ?? assetFormData.purchasePrice) || 0,
        depreciationMethod: assetFormData.depreciationMethod || 'straight-line',
        usefulLife: Number(assetFormData.usefulLife) || 5,
        salvageValue: Number(assetFormData.salvageValue) || 0,
        location: assetFormData.location || '',
        serialNumber: assetFormData.serialNumber || '',
        vendor: assetFormData.vendor || '',
        warranty: assetFormData.warranty || '',
        status: assetFormData.status || 'active',
        notes: assetFormData.notes || ''
      };

      const res = await fetch('/api/assets', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save asset to database');
      }

      await fetchAssets(selectedClient.client_id);
      setShowAssetModal(false);
      setEditingAsset(null);
      setAssetFormData({
        category: 'fixed',
        depreciationMethod: 'straight-line',
        status: 'active',
        usefulLife: 5,
        salvageValue: 0
      });
    } catch (err: any) {
      console.error('Error saving asset:', err);
      alert(err.message || 'Error saving asset');
    }
  };

  const deleteAsset = async (id: string) => {
    if (!selectedClient) return;
    if (!confirm('Are you sure you want to permanently delete this asset from the database?')) {
      return;
    }

    try {
      const res = await fetch(`/api/assets?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete asset');
      }
      await fetchAssets(selectedClient.client_id);
    } catch (err: any) {
      console.error('Error deleting asset:', err);
      alert(err.message || 'Error deleting asset');
    }
  };

  const syncQboFixedAssets = async () => {
    if (!selectedClient || !qbData?.fixedAssets || qbData.fixedAssets.length === 0) {
      alert('No QuickBooks fixed asset accounts found to synchronize.');
      return;
    }

    try {
      setRefreshing(true);
      let importedCount = 0;
      for (const qbAsset of qbData.fixedAssets) {
        const alreadyExists = assets.some(a => 
          a.name.toLowerCase() === qbAsset.name.toLowerCase() ||
          (a.notes && a.notes.includes(`Account #${qbAsset.id.replace('qbo-', '')}`))
        );

        if (!alreadyExists) {
          const res = await fetch('/api/assets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clientId: selectedClient.client_id,
              name: qbAsset.name,
              category: qbAsset.category || 'fixed',
              subcategory: qbAsset.subcategory || 'Commercial Vehicles',
              purchaseDate: qbAsset.purchaseDate || new Date().toISOString().split('T')[0],
              purchasePrice: qbAsset.purchasePrice || 0,
              currentValue: qbAsset.currentValue || qbAsset.purchasePrice || 0,
              depreciationMethod: qbAsset.depreciationMethod || 'straight-line',
              usefulLife: qbAsset.usefulLife || 5,
              salvageValue: qbAsset.salvageValue || 0,
              location: qbAsset.location || 'On Balance Sheet (QBO GL)',
              vendor: qbAsset.vendor || 'Intuit QuickBooks',
              status: 'active',
              notes: qbAsset.notes || 'Imported from QuickBooks Online General Ledger'
            })
          });
          if (res.ok) {
            importedCount++;
          }
        }
      }

      await fetchAssets(selectedClient.client_id);
      if (importedCount > 0) {
        alert(`Successfully imported ${importedCount} fixed asset(s) from QuickBooks General Ledger into database!`);
      } else {
        alert('All QuickBooks GL fixed assets are already present in the registry.');
      }
    } catch (err: any) {
      console.error('Error syncing QBO assets:', err);
      alert(err.message || 'Failed to sync assets from QuickBooks');
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenAddAsset = () => {
    setEditingAsset(null);
    setAssetFormData({
      category: 'fixed',
      depreciationMethod: 'straight-line',
      status: 'active',
      usefulLife: 5,
      salvageValue: 0
    });
    setShowAssetModal(true);
  };

  const handleOpenEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setAssetFormData(asset);
    setShowAssetModal(true);
  };

  const handleCloseAssetModal = () => {
    setShowAssetModal(false);
    setEditingAsset(null);
    setAssetFormData({
      category: 'fixed',
      depreciationMethod: 'straight-line',
      status: 'active',
      usefulLife: 5,
      salvageValue: 0
    });
  };

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      const element = document.createElement('a');
      const timeFrameLabel = timeFrameOptions.find(t => t.value === timeFrame)?.label || timeFrame;
      const file = new Blob([
        `PrimeCFO Executive Summary - ${selectedClient?.client_name || 'Portfolio'}\nCompany: ${selectedClient?.company_name || 'N/A'}\nPeriod: ${timeFrameLabel}\nCustomer AR: $${qbData?.customer?.balance ?? 0}\nTotal Cash: $${treasuryData.totalCash}\nBook Assets: $${assetTotals.totalCurrentValue}`
      ], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `PrimeCFO-AdminReport-${selectedClient?.client_name || 'portfolio'}-${timeFrame}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }, 800);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
      </div>
    );
  }

  const assetTotals = calculateAssetTotals(assets);
  const isQboConnected = Boolean(selectedClient?.client_qbo_connections?.[0]);
  const timeFrameLabel = timeFrameOptions.find(t => t.value === timeFrame)?.label || 'Last 30 Days';

  return (
    <AdminPortalShell
      activeView={activeView}
      setActiveView={setActiveView}
      clients={clients}
      selectedClient={selectedClient}
      setSelectedClient={setSelectedClient}
      timeFrame={timeFrame}
      setTimeFrame={setTimeFrame}
      refreshing={refreshing}
      onRefresh={() => selectedClient && fetchClientData(selectedClient)}
      alerts={alerts}
    >
      {selectedClient ? (
        <div>
          {/* Prime Accounting Trust Bar & Reporting Basis Indicator matching Client Portal */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 border-b border-slate-800/80 pb-4">
            <p className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-400 flex-shrink-0" />
              <span>
                Backed by <strong className="text-slate-300">Prime Accounting Solutions, LLC</strong> &mdash; Multi-client accounting intelligence & QuickBooks synchronizer.
              </span>
            </p>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-md text-[11px] font-medium text-slate-300">
                Basis: <strong className="text-teal-400">Cash / Accrual</strong>
              </span>
              <span className="px-2.5 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-300 rounded-md text-[11px] font-semibold">
                CFO Operator Mode
              </span>
            </div>
          </div>

          {/* QuickBooks Verified Banner if connected */}
          {isQboConnected && (
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-200">
                    QuickBooks Online Live Synchronized &bull; {qbData?.company?.legalName || selectedClient.company_name || selectedClient.client_name}
                  </p>
                  <p className="text-xs text-slate-300">
                    Live general ledger, {treasuryData.accountBalances.length} bank account(s), and {qbData?.invoices?.total ?? 0} invoices synchronized from Intuit Realm ID: <code className="font-mono text-emerald-300">{selectedClient.client_qbo_connections?.[0]?.company_id}</code>
                  </p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Verified Live Connection
              </span>
            </div>
          )}

          {/* QuickBooks Connection Warning Banner if not connected */}
          {!isQboConnected && !qbAlertDismissed && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-200">QuickBooks is not connected for this client</p>
                <p className="text-xs text-slate-300 mt-0.5">
                  Connect QuickBooks to sync general ledger, invoices, and accounts receivable automatically for {selectedClient.client_name}.
                </p>
                <button
                  type="button"
                  onClick={() => connectQBFromDashboard(selectedClient.client_id)}
                  className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-semibold hover:bg-amber-500/30 transition-colors cursor-pointer"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Connect QuickBooks</span>
                </button>
              </div>
              <button
                onClick={() => setQbAlertDismissed(true)}
                aria-label="Dismiss banner"
                className="shrink-0 p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Financial Dashboard Header matching Client Portal */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Financial Dashboard
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-teal-500/10 border border-teal-500/30 text-teal-300 rounded-md">
                  CFO Console
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                {selectedClient.client_name} &mdash; <span className="text-slate-300">{selectedClient.company_name || 'Individual Entity'}</span> &bull; <span className="text-teal-400">{timeFrameLabel}</span>
              </p>
            </div>

            {/* Action Controls matching client dashboard */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Date Range Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setRangeDropdownOpen(!rangeDropdownOpen)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-teal-400" />
                  <span>{timeFrameLabel}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${rangeDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {rangeDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setRangeDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-20 animate-in fade-in-50 zoom-in-95">
                      {timeFrameOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setTimeFrame(opt.value as TimeFrame);
                            setRangeDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-between ${
                            timeFrame === opt.value ? 'text-teal-400 bg-slate-800/50 font-medium' : 'text-slate-300'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {timeFrame === opt.value && <Check className="w-3.5 h-3.5 text-teal-400" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Sync Button */}
              <button
                type="button"
                onClick={() => selectedClient && fetchClientData(selectedClient)}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs sm:text-sm font-semibold rounded-xl hover:from-teal-400 hover:to-emerald-400 transition-all shadow-lg shadow-teal-500/25 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Syncing...' : 'Sync'}</span>
              </button>

              {/* Export Button */}
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isExporting ? 'Preparing…' : 'Export'}</span>
              </button>
            </div>
          </div>

          {/* Syncing Status Indicator */}
          {refreshing && (
            <div className="mb-6 bg-teal-500/10 border border-teal-500/20 rounded-xl p-4 flex items-center gap-3 animate-in fade-in-50">
              <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
              <div>
                <p className="text-sm font-semibold text-teal-400">Syncing live accounting records from QuickBooks...</p>
                <p className="text-xs text-slate-400">Updating accounts receivable balances and ledger entries</p>
              </div>
            </div>
          )}

          {/* Tab Views */}
          {activeView === 'overview' && (
            <OverviewTab 
              selectedClient={selectedClient}
              qbData={qbData}
              treasuryData={treasuryData}
              assets={assets}
              assetTotals={assetTotals}
              analyticsData={analyticsData}
              onConnectQuickBooks={connectQBFromDashboard}
              setActiveView={setActiveView}
            />
          )}

          {activeView === 'treasury' && (
            <TreasuryTab 
              treasuryData={treasuryData}
            />
          )}

          {activeView === 'assets' && (
            <AssetsTab 
              assets={assets}
              assetTotals={assetTotals}
              onAddAsset={handleOpenAddAsset}
              onEditAsset={handleOpenEditAsset}
              onDeleteAsset={deleteAsset}
              onSyncQboAssets={syncQboFixedAssets}
              qboFixedAssetsCount={qbData?.fixedAssets?.length || 0}
              isQboConnected={isQboConnected}
            />
          )}

          {activeView === 'transactions' && (
            <TransactionsTab 
              qbData={qbData}
            />
          )}

          {activeView === 'analytics' && (
            <AnalyticsTab 
              analyticsData={analyticsData}
            />
          )}

          {activeView === 'documents' && (
            <DocumentsTab />
          )}

          {activeView === 'alerts' && (
            <AlertsTab 
              alerts={alerts}
            />
          )}

          {activeView === 'integrations' && (
            <IntegrationsTab 
              selectedClient={selectedClient}
              onConnectQuickBooks={connectQBFromDashboard}
            />
          )}

          {activeView === 'notes' && (
            <NotesTab 
              notes={notes}
              setNotes={setNotes}
              editingNotes={editingNotes}
              setEditingNotes={setEditingNotes}
              onSaveNotes={saveNotes}
            />
          )}
        </div>
      ) : (
        /* Executive Empty / Selection State */
        <div className="max-w-4xl mx-auto py-16">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-10 text-center shadow-2xl backdrop-blur-xl">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-teal-500/10">
              <Building className="w-8 h-8" />
            </div>
            
            <h2 className="text-2xl font-bold text-white tracking-tight mb-2">No Client Portfolio Selected</h2>
            <p className="text-slate-400 max-w-md mx-auto mb-8 text-xs sm:text-sm leading-relaxed">
              Select an existing client entity to inspect their live financial ratios, general ledger entries, cash runway, and depreciation schedules.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
              <button
                type="button"
                onClick={() => setSelectedClient(clients[0] || DEFAULT_SAMPLE_CLIENTS[0])}
                className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl hover:from-teal-400 hover:to-emerald-400 font-semibold text-xs transition-all shadow-lg shadow-teal-500/20 cursor-pointer flex items-center gap-2"
              >
                <span>Open Acme Holdings Portfolio</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                href="/admin/clients/add"
                className="px-5 py-2.5 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl hover:bg-slate-700 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Register New Client</span>
              </Link>
            </div>

            {/* Quick Select Client Cards */}
            <div className="border-t border-slate-800/80 pt-8 text-left">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 text-center">
                Available Client Portfolios
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(clients.length > 0 ? clients : DEFAULT_SAMPLE_CLIENTS).map(client => (
                  <button
                    key={client.client_id}
                    type="button"
                    onClick={() => setSelectedClient(client)}
                    className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-teal-500/50 hover:bg-slate-800/80 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white text-xs group-hover:text-teal-300 transition-colors">
                        {client.client_name}
                      </span>
                      {client.client_qbo_connections?.[0] && (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mb-2 truncate">{client.company_name || 'Independent Client'}</p>
                    <span className="text-[11px] text-teal-400 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Launch View &rarr;
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Asset Modal */}
      <AssetModal 
        isOpen={showAssetModal}
        onClose={handleCloseAssetModal}
        onSave={saveAsset}
        editingAsset={editingAsset}
        assetFormData={assetFormData}
        setAssetFormData={setAssetFormData}
      />
    </AdminPortalShell>
  );
}