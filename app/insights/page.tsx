'use client';

import React, { useState, useEffect } from 'react';
import PortalShell from '@/components/portal/PortalShell';
import {
  Brain,
  Sparkles,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Calendar,
  ArrowRight,
  ShieldAlert,
  Zap,
  DollarSign,
  FileText,
  UserCheck
} from 'lucide-react';

interface InsightItem {
  id: string;
  category: 'all' | 'high_priority' | 'revenue' | 'expenses' | 'working_capital';
  categoryLabel: string;
  isHighPriority: boolean;
  title: string;
  description: string;
  impactMetric: string;
  recommendation: string;
  date: string;
}

export default function InsightsPage() {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [qbData, setQbData] = useState<any>(null);
  const [advisoryNotes, setAdvisoryNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const filterOptions = [
    { key: 'all', label: 'All' },
    { key: 'high_priority', label: 'High Priority' },
    { key: 'revenue', label: 'Revenue' },
    { key: 'expenses', label: 'Expenses' },
    { key: 'working_capital', label: 'Working Capital' },
  ];

  const loadData = () => {
    setLoading(true);
    return Promise.all([
      fetch('/api/metrics?period=3m')
        .then((r) => r.json())
        .then((res) => setMetrics(res?.data || null))
        .catch(() => setMetrics(null)),
      fetch('/api/quickbooks/customer?timeFrame=3m')
        .then((r) => r.json())
        .then((res) => {
          if (res.status === 'connected') setQbData(res);
        })
        .catch(() => setQbData(null)),
      fetch('/api/notes')
        .then((r) => r.json())
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setAdvisoryNotes(res.data);
          }
        })
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const fmt = (n: number) => '$' + Math.round(n).toLocaleString('en-US');

  const cash = Number(qbData?.treasury?.totalCash ?? metrics?.cashPosition) || 0;
  const revenue = Number(qbData?.invoices?.totalAmount ?? qbData?.profitLoss?.revenue ?? metrics?.revenue) || 0;
  const netProfit = Number(qbData?.profitLoss?.netIncome ?? metrics?.netProfit) || 0;
  const margin = Number(qbData?.kpis?.netMargin ?? metrics?.profitMargin) || (revenue > 0 ? (netProfit / revenue) * 100 : 0);
  const ar = Number(qbData?.customer?.balance ?? metrics?.arAging) || 0;
  const runway = Number(qbData?.kpis?.runway ?? metrics?.cashRunway) || 0;
  const hasData = [cash, revenue, netProfit, ar, runway].some((v) => v !== 0);

  const insightsList: InsightItem[] = [];
  if (hasData) {
    const when = 'Live from QuickBooks synchronization';

    if (runway > 0) {
      const low = runway < 3;
      insightsList.push({
        id: 'runway',
        category: 'working_capital',
        categoryLabel: 'Cash Runway',
        isHighPriority: low,
        title: low ? `Cash runway is constrained at ${runway.toFixed(1)} months` : `Cash runway healthy at ${runway.toFixed(1)} months`,
        description: `Your verified cash position of ${fmt(cash)} provides ${runway.toFixed(1)} months of operational runway at current trailing burn rates.`,
        impactMetric: `${runway.toFixed(1)} Months Runway`,
        recommendation: low
          ? 'Prioritize collection on aging invoices and evaluate discretionary expense cuts to extend runway past 3.0 months.'
          : 'Consider allocating surplus liquid capital into yield-bearing reserves while maintaining 3-month operating buffers.',
        date: when,
      });
    }

    if (revenue > 0) {
      const low = margin < 10;
      insightsList.push({
        id: 'margin',
        category: 'revenue',
        categoryLabel: 'Profitability',
        isHighPriority: low,
        title: `Net operating profit margin at ${margin.toFixed(1)}%`,
        description: `Total invoiced revenue of ${fmt(revenue)} generated net operating income of ${fmt(Number(metrics.netProfit) || 0)}.`,
        impactMetric: `${margin.toFixed(1)}% Net Margin`,
        recommendation: low
          ? 'Conduct a line-item audit of cost of goods sold and contractor fees to elevate net margins toward 15%+.'
          : 'Maintain current overhead cost discipline as top-line contract volume scales.',
        date: when,
      });
    }

    if (cash > 0 && runway > 0) {
      const monthlyBurn = cash / runway;
      insightsList.push({
        id: 'expenses',
        category: 'expenses',
        categoryLabel: 'Cost Velocity',
        isHighPriority: false,
        title: `Estimated monthly operating burn at ${fmt(monthlyBurn)}`,
        description: `Across recent billing cycles, operational cash requirements average ${fmt(monthlyBurn)} per month.`,
        impactMetric: `${fmt(monthlyBurn)} / Mo Burn Rate`,
        recommendation: 'Review vendor recurring software subscriptions and facilities costs with your Prime advisory team.',
        date: when,
      });
    }

    if (ar > 0) {
      insightsList.push({
        id: 'ar',
        category: 'working_capital',
        categoryLabel: 'Accounts Receivable',
        isHighPriority: revenue > 0 && ar > revenue * 0.25,
        title: `${fmt(ar)} in outstanding receivables pending collection`,
        description: `Uncollected customer invoices total ${fmt(ar)}. Timely receipts are vital to sustaining working capital buffers.`,
        impactMetric: `${fmt(ar)} Pending Inflow`,
        recommendation: 'Issue automated payment reminders on all open invoices 5 days ahead of payment terms.',
        date: when,
      });
    }
  }

  const filteredInsights = insightsList.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'high_priority') return item.isHighPriority;
    return item.category === activeFilter;
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData().finally(() => setIsRefreshing(false));
  };

  return (
    <PortalShell activeView="insights">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              AI Insights
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20">
              Prime Financial Intelligence
            </span>
          </div>
          <p className="text-sm text-slate-400">
            {filteredInsights.length} actionable insights synthesized from your verified QuickBooks metrics and advisory workpapers.
          </p>
        </div>

        {/* Filter Pills & Refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          {filterOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setActiveFilter(opt.key)}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-xl transition-all cursor-pointer ${
                activeFilter === opt.key
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30 shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {opt.label}
            </button>
          ))}

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* CPA Advisor Direct Workpapers Section */}
      {advisoryNotes.length > 0 && (
        <div className="mb-8 bg-gradient-to-br from-teal-500/10 via-slate-900 to-slate-900 border border-teal-500/30 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <UserCheck className="w-5 h-5 text-teal-400" />
            <h2 className="text-base font-bold text-white">Dedicated CPA &amp; Advisor Notes</h2>
          </div>
          <div className="space-y-3">
            {advisoryNotes.map((note) => (
              <div key={note.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <span className="font-semibold text-teal-300">{note.author || 'CFO Advisory Lead'}</span>
                  <span className="text-slate-500">{new Date(note.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{note.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights List */}
      <div className="space-y-4">
        {!loading && filteredInsights.length === 0 && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center">
            <Brain className="w-8 h-8 text-violet-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No insights in this category</h3>
            <p className="text-sm text-slate-400">
              {hasData
                ? 'No issues or opportunities detected for this filter.'
                : 'Connect QuickBooks to generate real-time AI insights for your organization.'}
            </p>
            {!hasData && (
              <a href="/connect" className="inline-block mt-4 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold">
                Connect QuickBooks
              </a>
            )}
          </div>
        )}

        {filteredInsights.map((insight) => (
          <div
            key={insight.id}
            className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-slate-700/80 transition-all shadow-xl flex flex-col md:flex-row md:items-start justify-between gap-6"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 px-2.5 py-0.5 bg-teal-500/10 border border-teal-500/20 rounded-md">
                  {insight.categoryLabel}
                </span>

                {insight.isHighPriority && (
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 px-2.5 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-md flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    High Priority
                  </span>
                )}

                <span className="text-xs text-slate-500">{insight.date}</span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-white mb-2">
                {insight.title}
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                {insight.description}
              </p>

              <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs text-slate-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Actionable Recommendation:</strong> {insight.recommendation}
                </div>
              </div>
            </div>

            {/* Impact Metric Badge Box */}
            <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl md:min-w-[190px]">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
                Projected Impact
              </span>
              <span className="text-sm sm:text-base font-bold text-emerald-400">
                {insight.impactMetric}
              </span>
            </div>
          </div>
        ))}
      </div>
    </PortalShell>
  );
}
