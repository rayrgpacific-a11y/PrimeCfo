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
import { generateFinancialSummaryPdf } from '@/lib/pdf-export';

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
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [actionItems, setActionItems] = useState<any[]>([]);
  const [actionItemsLoading, setActionItemsLoading] = useState(false);
  const [isResolvingAlerts, setIsResolvingAlerts] = useState(false);
  
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
      inflows: 0,
      outflows: 0,
      net: 0
    },
    creditLines: [],
    upcomingTransactions: []
  });

  // Analytics KPI & variance data
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    kpis: {
      grossMargin: 0,
      netMargin: 0,
      currentRatio: 0,
      quickRatio: 0,
      dso: 0,
      dpo: 0,
      burnRate: 0,
      runway: 0
    },
    trends: {
      revenue: [],
      expenses: []
    },
    budgetVariance: {
      revenue: { actual: 0, budget: 0, variance: 0 },
      expenses: { actual: 0, budget: 0, variance: 0 }
    }
  });

  // Real Alerts data fetched from authentic database
  const [alerts, setAlerts] = useState<Alert[]>([]);

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
      fetchNotes(selectedClient.client_id);
      fetchActionItems(selectedClient.client_id);
      fetchAlerts(selectedClient.client_id);
    }
  }, [selectedClient, timeFrame]);

  const fetchAlerts = async (clientId: string) => {
    try {
      const res = await fetch(`/api/alerts?clientId=${encodeURIComponent(clientId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setAlerts(json.data);
          return;
        }
      }
      setAlerts([]);
    } catch (e) {
      console.warn('Failed to fetch alerts for client:', e);
      setAlerts([]);
    }
  };

  const fetchNotes = async (clientId: string) => {
    try {
      const res = await fetch(`/api/notes?clientId=${encodeURIComponent(clientId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          setNotes(json.data[0].content);
          return;
        }
      }
      setNotes(selectedClient?.notes || '');
    } catch (e) {
      console.warn('Failed to fetch notes for client:', e);
      setNotes(selectedClient?.notes || '');
    }
  };

  const fetchActionItems = async (clientId: string) => {
    setActionItemsLoading(true);
    try {
      const res = await fetch(`/api/action-items?clientId=${encodeURIComponent(clientId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setActionItems(json.data);
          return;
        }
      }
      setActionItems([]);
    } catch (e) {
      console.warn('Failed to fetch action items:', e);
      setActionItems([]);
    } finally {
      setActionItemsLoading(false);
    }
  };

  const saveNotes = async () => {
    if (!selectedClient) return;
    setIsSavingNotes(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.client_id,
          content: notes,
          author: 'CFO Lead'
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save advisory notes');
      }
      setEditingNotes(false);
    } catch (err: any) {
      console.error('Error saving notes:', err);
      alert(err.message || 'Error saving notes');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleToggleActionItem = async (id: string, isCompleted: boolean) => {
    try {
      setActionItems(prev => prev.map(item => item.id === id ? { ...item, isCompleted } : item));
      await fetch('/api/action-items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isCompleted })
      });
    } catch (err) {
      console.error('Failed to toggle action item:', err);
    }
  };

  const handleAddActionItem = async (title: string, priority: string, dueDate?: string) => {
    if (!selectedClient) return;
    try {
      const res = await fetch('/api/action-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.client_id,
          title,
          priority,
          dueDate
        })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setActionItems(prev => [json.data, ...prev]);
        }
      }
    } catch (err) {
      console.error('Failed to add action item:', err);
    }
  };

  const handleDeleteActionItem = async (id: string) => {
    try {
      setActionItems(prev => prev.filter(item => item.id !== id));
      await fetch(`/api/action-items?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error('Failed to delete action item:', err);
    }
  };

  const handleMarkAllAlertsRead = async () => {
    if (!selectedClient) return;
    setIsResolvingAlerts(true);
    try {
      setAlerts([]);
      await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.client_id,
          resolveAll: true
        })
      });
    } catch (err) {
      console.error('Failed to resolve all alerts:', err);
    } finally {
      setIsResolvingAlerts(false);
    }
  };

  const handleResolveAlert = async (id: string) => {
    try {
      setAlerts(prev => prev.filter(a => a.id !== id));
      await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isResolved: true })
      });
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

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
      setClients([]);
      setSelectedClient(null);
    } catch (error) {
      console.warn('API clients fetch failed:', error);
      setClients([]);
      setSelectedClient(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientData = async (client: Client) => {
    setRefreshing(true);

    // If client is not connected to QuickBooks, reset qbData and hydrate authentic Supabase metrics
    if (!client.client_qbo_connections?.[0]) {
      setQbData(null);
      try {
        const mRes = await fetch(`/api/metrics?clientId=${encodeURIComponent(client.client_id)}&period=${timeFrame}`);
        if (mRes.ok) {
          const mJson = await mRes.json();
          if (mJson.data) {
            const m = mJson.data;
            const burnRate = m.cashRunway > 0 && m.cashPosition > 0 ? Math.round(m.cashPosition / m.cashRunway) : 0;
            setTreasuryData({
              totalCash: m.cashPosition || 0,
              accountBalances: [],
              cashFlow: {
                inflows: m.revenue || 0,
                outflows: (m.revenue || 0) - (m.netProfit || 0),
                net: m.netProfit || 0
              },
              creditLines: [],
              upcomingTransactions: []
            });
            setAnalyticsData({
              kpis: {
                grossMargin: m.profitMargin || 0,
                netMargin: m.profitMargin || 0,
                currentRatio: 0,
                quickRatio: 0,
                dso: m.arAging > 0 ? 30 : 0,
                dpo: 0,
                burnRate,
                runway: m.cashRunway || 0
              },
              trends: {
                revenue: (m.monthlyTrajectory || []).map((t: any) => ({ month: t.label, value: t.revenue })),
                expenses: (m.monthlyTrajectory || []).map((t: any) => ({ month: t.label, value: t.expenses }))
              },
              budgetVariance: {
                revenue: { actual: m.revenue || 0, budget: m.revenue || 0, variance: 0 },
                expenses: { actual: (m.revenue || 0) - (m.netProfit || 0), budget: (m.revenue || 0) - (m.netProfit || 0), variance: 0 }
              }
            });
          }
        }
      } catch (e) {
        console.warn('Failed to load metrics for unconnected client:', e);
      } finally {
        setRefreshing(false);
      }
      return;
    }

    const connection = client.client_qbo_connections[0];
    
    try {
      const [response, metricsRes] = await Promise.all([
        fetch(
          `/api/quickbooks/customer?clientId=${client.client_id}&customerId=${connection.customer_id}&companyId=${connection.company_id}&timeFrame=${timeFrame}`
        ),
        fetch(`/api/metrics?clientId=${encodeURIComponent(client.client_id)}&period=${timeFrame}`)
      ]);
      
      let metricsTrajectory: any[] = [];
      if (metricsRes.ok) {
        const mJson = await metricsRes.json();
        if (mJson.data?.monthlyTrajectory) {
          metricsTrajectory = mJson.data.monthlyTrajectory;
        }
      }

      if (response.ok) {
        const data = await response.json();
        setQbData(data);

        // Wire live treasury and cash balances directly from Intuit general ledger
        if (data.treasury) {
          setTreasuryData(prev => ({
            ...prev,
            totalCash: data.treasury.totalCash || 0,
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
            trends: metricsTrajectory.length > 0 ? {
              revenue: metricsTrajectory.map((t: any) => ({ month: t.label, value: t.revenue })),
              expenses: metricsTrajectory.map((t: any) => ({ month: t.label, value: t.expenses }))
            } : prev.trends,
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
        setQbData(null);
      }
    } catch (error) {
      console.error('Error fetching QB data:', error);
      setQbData(null);
    } finally {
      setRefreshing(false);
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
    if (!selectedClient) return;
    setIsExporting(true);
    try {
      const timeFrameLabel = timeFrameOptions.find(t => t.value === timeFrame)?.label || 'Last 30 Days';
      const revenue = qbData?.invoices?.totalAmount ?? qbData?.profitLoss?.revenue ?? 0;
      const netIncome = (qbData?.profitLoss?.revenue ?? 0) - (qbData?.expenses?.totalAmount ?? 0);
      const cash = treasuryData.totalCash || (qbData?.treasury?.totalCash ?? 0);

      generateFinancialSummaryPdf({
        clientName: selectedClient.company_name || selectedClient.client_name || 'Client Portfolio',
        periodLabel: timeFrameLabel,
        basis: 'Cash',
        revenue,
        netIncome,
        cash,
        grossMargin: analyticsData.kpis.grossMargin,
        netMargin: analyticsData.kpis.netMargin,
        currentRatio: analyticsData.kpis.currentRatio,
        quickRatio: analyticsData.kpis.quickRatio,
        dso: analyticsData.kpis.dso,
        filename: `PrimeCFO-Executive-Summary-${(selectedClient.company_name || selectedClient.client_name || 'portfolio').toLowerCase().replace(/\s+/g, '-')}-${timeFrame}.pdf`
      });
    } catch (e) {
      console.error('Failed to generate export PDF:', e);
    } finally {
      setIsExporting(false);
    }
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
            <DocumentsTab selectedClient={selectedClient} />
          )}

          {activeView === 'alerts' && (
            <AlertsTab 
              alerts={alerts}
              onMarkAllRead={handleMarkAllAlertsRead}
              onResolveAlert={handleResolveAlert}
              isResolving={isResolvingAlerts}
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
              isSavingNotes={isSavingNotes}
              actionItems={actionItems}
              onToggleActionItem={handleToggleActionItem}
              onAddActionItem={handleAddActionItem}
              onDeleteActionItem={handleDeleteActionItem}
              actionItemsLoading={actionItemsLoading}
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

            {clients.length > 0 ? (
              <>
                <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
                  <button
                    type="button"
                    onClick={() => setSelectedClient(clients[0])}
                    className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl hover:from-teal-400 hover:to-emerald-400 font-semibold text-xs transition-all shadow-lg shadow-teal-500/20 cursor-pointer flex items-center gap-2"
                  >
                    <span>Open {clients[0].company_name || clients[0].client_name} Portfolio</span>
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
                    {clients.map(client => (
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
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-6">
                <Link
                  href="/admin/clients/add"
                  className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl hover:from-teal-400 hover:to-emerald-400 font-semibold text-xs transition-all shadow-lg shadow-teal-500/20 cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register First Client Portfolio</span>
                </Link>
              </div>
            )}
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