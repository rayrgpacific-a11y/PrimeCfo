'use client';

import React from 'react';
import Link from 'next/link';
import { 
  DollarSign, 
  FileText, 
  Building2, 
  Wallet, 
  AlertCircle, 
  Link as LinkIcon, 
  CheckCircle2,
  TrendingUp,
  PieChart,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Client, QuickBooksData, TreasuryData, Asset, AnalyticsData, ViewType } from '@/types/admin';
import { formatCurrency, calculateAssetTotals } from '@/lib/admin-utils';

interface OverviewTabProps {
  selectedClient: Client;
  qbData: QuickBooksData | null;
  treasuryData: TreasuryData;
  assets: Asset[];
  assetTotals: ReturnType<typeof calculateAssetTotals>;
  analyticsData?: AnalyticsData;
  onConnectQuickBooks: (clientId: string) => void;
  setActiveView?: (view: ViewType) => void;
}

export default function OverviewTab({
  selectedClient,
  qbData,
  treasuryData,
  assets,
  assetTotals,
  analyticsData,
  onConnectQuickBooks,
  setActiveView
}: OverviewTabProps) {
  const isQboConnected = Boolean(selectedClient.client_qbo_connections?.[0]);

  const kpis = analyticsData?.kpis || {
    grossMargin: 42.5,
    netMargin: 18.3,
    burnRate: 280000,
    runway: 10.2
  };

  const metricCards = [
    {
      id: 'cash-position',
      title: 'Cash Position',
      value: formatCurrency(treasuryData.totalCash),
      trend: '+4.8%',
      trendUp: true,
      context: treasuryData.accountBalances.length > 0 
        ? `Across ${treasuryData.accountBalances.length} primary bank account${treasuryData.accountBalances.length === 1 ? '' : 's'}`
        : 'Across operating accounts',
      icon: Wallet,
      badge: 'Liquidity'
    },
    {
      id: 'ar-balance',
      title: 'Current AR Balance',
      value: formatCurrency(qbData?.customer?.balance ?? 0),
      trend: '-2.1%',
      trendUp: false,
      context: 'Active client accounts receivable',
      icon: DollarSign,
      badge: 'Aging'
    },
    {
      id: 'revenue',
      title: 'Total Invoiced (YTD)',
      value: formatCurrency(qbData?.invoices?.totalAmount ?? 0),
      trend: '+8.2%',
      trendUp: true,
      context: `${qbData?.invoices?.total ?? 0} invoices processed`,
      icon: TrendingUp,
      badge: 'Revenue'
    },
    {
      id: 'gross-margin',
      title: 'Gross Margin',
      value: `${kpis.grossMargin}%`,
      trend: '+1.5%',
      trendUp: true,
      context: `Net margin benchmarked at ${kpis.netMargin}%`,
      icon: PieChart,
      badge: 'Profitability'
    },
    {
      id: 'total-assets',
      title: 'Total Registered Assets',
      value: formatCurrency(assetTotals.totalCurrentValue),
      trend: '+12.4%',
      trendUp: true,
      context: `${assets.length} registered fixed assets`,
      icon: Building2,
      badge: 'Book Value'
    },
    {
      id: 'cash-runway',
      title: 'Cash Runway',
      value: `${kpis.runway} mo`,
      trend: '+1.2 mo',
      trendUp: true,
      context: `Burn rate approx ${formatCurrency(kpis.burnRate)}/mo`,
      icon: Clock,
      badge: 'Capital'
    }
  ];

  return (
    <div className="space-y-8">
      {/* 6 Key Metrics Grid matching Client Portal styling */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {metricCards.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 hover:border-slate-700 transition-all shadow-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-medium truncate pr-2">
                  {item.title}
                </span>
                <div className="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center text-teal-400 shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-1.5">
                <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight tabular-nums">
                  {item.value}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs">
                <p className="text-slate-500 truncate text-[11px] sm:text-xs">
                  {item.context}
                </p>
                <span
                  className={`inline-flex items-center text-[11px] font-semibold shrink-0 ${
                    item.trendUp ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {item.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {item.trend}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Trend Visualizer & AI Summary Widget */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Revenue Trend</p>
              <h3 className="text-lg font-bold text-white mt-0.5">Last 12 Months Cash Inflow &amp; AR Velocity</h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
              +18.4% YoY
            </span>
          </div>

          {/* Interactive SVG Chart matching client portal */}
          <div className="relative h-48 w-full pt-4">
            <svg viewBox="0 0 500 150" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="adminChartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M0,130 C60,110 120,120 180,85 C240,95 300,60 360,70 C420,40 460,25 500,15 L500,150 L0,150 Z"
                fill="url(#adminChartGradient)"
              />
              <path
                d="M0,130 C60,110 120,120 180,85 C240,95 300,60 360,70 C420,40 460,25 500,15"
                fill="none"
                stroke="#14b8a6"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-800/80">
            <span>Nov</span>
            <span>Jan</span>
            <span>Mar</span>
            <span>May</span>
            <span>Jul</span>
            <span>Sep</span>
            <span>Nov</span>
          </div>
        </div>

        {/* AI Insight Spotlight Card */}
        <div className="bg-gradient-to-br from-teal-500/10 via-slate-900 to-slate-900 border border-teal-500/20 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xs uppercase tracking-widest font-semibold text-teal-300">
                AI Advisory Insight
              </span>
            </div>

            <h4 className="text-base font-semibold text-white mb-2">
              {isQboConnected ? 'QuickBooks GL Synchronized' : 'Working Capital Acceleration'}
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isQboConnected ? (
                <>
                  QuickBooks Online verified <strong>{qbData?.invoices?.total ?? 0} invoices</strong> totaling <strong>{formatCurrency(qbData?.invoices?.totalAmount ?? 0)}</strong>. Cash reserves stand at <strong>{formatCurrency(treasuryData.totalCash)}</strong> across verified accounts, with <strong>{formatCurrency(qbData?.customer?.balance ?? 0)}</strong> in outstanding receivables.
                </>
              ) : (
                <>
                  Revenue is pacing <strong>+12% MoM</strong> for {selectedClient.client_name}. Connect QuickBooks to enable automated general ledger reconciliation.
                </>
              )}
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800/80">
            {setActiveView ? (
              <button
                type="button"
                onClick={() => setActiveView('analytics')}
                className="text-xs font-semibold text-teal-400 hover:text-teal-300 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Explore full KPI breakdown</span>
                <span>&rarr;</span>
              </button>
            ) : (
              <Link
                href="/admin/dashboard"
                className="text-xs font-semibold text-teal-400 hover:text-teal-300 inline-flex items-center gap-1.5 transition-colors"
              >
                <span>Explore all insights</span>
                <span>&rarr;</span>
              </Link>
            )}
          </div>
        </div>
      </div>   

      {/* Client Profile & QuickBooks Connection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client Information */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-white tracking-tight">Client Profile</h3>
            <span className="px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-medium">
              Active Client
            </span>
          </div>
          
          <dl className="space-y-3.5 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
              <dt className="text-slate-400 font-medium">Company Name</dt>
              <dd className="text-white font-medium">{qbData?.company?.legalName || selectedClient.company_name || selectedClient.client_name}</dd>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
              <dt className="text-slate-400 font-medium">Client Contact</dt>
              <dd className="text-white font-medium">{selectedClient.client_name}</dd>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
              <dt className="text-slate-400 font-medium">Email Address</dt>
              <dd className="text-slate-300 font-mono text-xs">{selectedClient.email}</dd>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
              <dt className="text-slate-400 font-medium">Phone</dt>
              <dd className="text-slate-300 font-mono text-xs">{selectedClient.phone || '—'}</dd>
            </div>
            <div className="pt-2">
              <dt className="text-slate-400 font-medium mb-2">Industry Tags</dt>
              <dd className="flex gap-1.5 flex-wrap">
                {selectedClient.tags?.map(tag => (
                  <span key={tag} className="px-2.5 py-1 bg-slate-800 border border-slate-700/60 text-slate-300 text-xs rounded-lg font-medium">
                    {tag}
                  </span>
                )) || <span className="text-xs text-slate-500">No tags assigned</span>}
              </dd>
            </div>
          </dl>
        </div>

        {/* QuickBooks Connection */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-white tracking-tight">QuickBooks Sync Status</h3>
            {isQboConnected ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Live Connection
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                Action Required
              </span>
            )}
          </div>

          {isQboConnected ? (
            <dl className="space-y-3.5 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                <dt className="text-slate-400 font-medium">Integration Status</dt>
                <dd className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  Synced &amp; Active
                </dd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                <dt className="text-slate-400 font-medium">Intuit Realm / Company ID</dt>
                <dd className="text-slate-300 font-mono text-xs">
                  {selectedClient.client_qbo_connections?.[0]?.company_id}
                </dd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                <dt className="text-slate-400 font-medium">Customer ID</dt>
                <dd className="text-slate-300 font-mono text-xs">
                  {selectedClient.client_qbo_connections?.[0]?.customer_id}
                </dd>
              </div>
              <div className="pt-3">
                <a
                  href={`https://app.qbo.intuit.com/app/customerdetail?nameId=${selectedClient.client_qbo_connections?.[0]?.customer_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 font-semibold text-xs transition-colors"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  Manage in QuickBooks Online
                </a>
              </div>
            </dl>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-slate-300 font-medium text-sm mb-1">No QuickBooks Connection</p>
              <p className="text-slate-500 text-xs mb-5 max-w-sm mx-auto">
                Connect this client to Intuit QuickBooks to enable automated general ledger synchronization.
              </p>
              <button
                type="button"
                onClick={() => onConnectQuickBooks(selectedClient.client_id)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl hover:from-teal-400 hover:to-emerald-400 font-semibold text-xs transition-all shadow-lg shadow-teal-500/20 cursor-pointer"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                Connect QuickBooks Account
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Access Action Cards matching client portal */}
      {setActiveView && (
        <div className="grid sm:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => setActiveView('analytics')}
            className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 hover:border-teal-500/30 hover:bg-slate-900 transition-all text-left group shadow-lg cursor-pointer"
          >
            <p className="text-sm font-semibold text-white mb-1 group-hover:text-teal-400 transition-colors">
              View Financial Statements
            </p>
            <p className="text-xs text-slate-400">P&amp;L, Balance Sheet, Budget Variance</p>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('treasury')}
            className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 hover:border-cyan-500/30 hover:bg-slate-900 transition-all text-left group shadow-lg cursor-pointer"
          >
            <p className="text-sm font-semibold text-white mb-1 group-hover:text-cyan-400 transition-colors">
              Treasury &amp; Liquidity
            </p>
            <p className="text-xs text-slate-400">Multi-bank balances &amp; credit facilities</p>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('assets')}
            className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 hover:border-emerald-500/30 hover:bg-slate-900 transition-all text-left group shadow-lg cursor-pointer"
          >
            <p className="text-sm font-semibold text-white mb-1 group-hover:text-emerald-400 transition-colors">
              Asset Depreciation Register
            </p>
            <p className="text-xs text-slate-400">Manage capital assets &amp; schedules</p>
          </button>
        </div>
      )}
    </div>
  );
}
