'use client';

import React, { useState, useEffect } from 'react';
import PortalShell from '@/components/portal/PortalShell';
import {
  Brain,
  Sparkles,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Zap,
  DollarSign,
  FileText,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Target,
  MessageSquare
} from 'lucide-react';

interface Recommendation {
  action: string;
  expectedImpact?: string;
}

interface InsightItem {
  id: string;
  title: string;
  description: string;
  urgency: 'critical' | 'warning' | 'info' | 'positive' | 'watch' | string;
  category: string;
  metric?: string | null;
  metricValue?: string | null;
  recommendations: Recommendation[];
  talkingPoints: string[];
  severityOrder?: number;
  createdAt: string;
}

interface RiskPosture {
  id: string;
  rating: string;
  summary: string;
  topAction: string;
  reportRange?: string;
  createdAt: string;
}

export default function InsightsPage() {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [riskPosture, setRiskPosture] = useState<RiskPosture | null>(null);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [advisoryNotes, setAdvisoryNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTalkingPoints, setExpandedTalkingPoints] = useState<Record<string, boolean>>({});

  const filterOptions = [
    { key: 'all', label: 'All Insights' },
    { key: 'high_priority', label: 'High Priority' },
    { key: 'Revenue', label: 'Revenue' },
    { key: 'Expenses', label: 'Expenses' },
    { key: 'Margins', label: 'Margins' },
    { key: 'Cash Runway', label: 'Cash Runway' },
    { key: 'Strategy', label: 'Tax & Growth' },
  ];

  const loadData = () => {
    setLoading(true);
    return Promise.all([
      fetch('/api/insights')
        .then((r) => r.json())
        .then((res) => {
          if (res.success && res.data) {
            setRiskPosture(res.data.riskPosture || null);
            setInsights(Array.isArray(res.data.insights) ? res.data.insights : []);
          }
        })
        .catch(() => {
          setRiskPosture(null);
          setInsights([]);
        }),
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

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetch('/api/insights', { method: 'POST' })
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setRiskPosture(res.data.riskPosture || null);
          setInsights(Array.isArray(res.data.insights) ? res.data.insights : []);
        }
      })
      .catch((err) => {
        console.error('Refresh failed:', err);
      })
      .finally(() => setIsRefreshing(false));
  };

  const toggleTalkingPoints = (id: string) => {
    setExpandedTalkingPoints((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredInsights = insights.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'high_priority') {
      return item.urgency === 'critical' || item.urgency === 'warning' || (item.severityOrder && item.severityOrder <= 2);
    }
    if (activeFilter === 'Strategy') {
      return (
        item.category === 'Tax Positioning' ||
        item.category === 'Growth Capacity' ||
        item.category === 'Owner Compensation'
      );
    }
    return item.category.toLowerCase() === activeFilter.toLowerCase();
  });

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'critical':
        return (
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 px-2.5 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-md flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            Critical
          </span>
        );
      case 'warning':
        return (
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-amber-400" />
            Warning
          </span>
        );
      case 'positive':
        return (
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Positive
          </span>
        );
      case 'watch':
        return (
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 px-2.5 py-0.5 bg-sky-500/10 border border-sky-500/20 rounded-md flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-sky-400" />
            Watch
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-bold uppercase tracking-wider text-violet-400 px-2.5 py-0.5 bg-violet-500/10 border border-violet-500/20 rounded-md flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-violet-400" />
            Info
          </span>
        );
    }
  };

  const getRiskPostureStyle = (rating: string) => {
    const r = rating?.toUpperCase() || 'MODERATE';
    if (r === 'HIGH' || r === 'CRITICAL') {
      return {
        wrapper: 'border-rose-500/40 bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 shadow-rose-950/20',
        badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        icon: <ShieldAlert className="w-6 h-6 text-rose-400" />,
        actionBox: 'bg-rose-950/30 border-rose-500/30 text-rose-200',
        actionLabel: 'text-rose-400',
      };
    }
    if (r === 'LOW' || r === 'HEALTHY') {
      return {
        wrapper: 'border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 shadow-emerald-950/20',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
        actionBox: 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200',
        actionLabel: 'text-emerald-400',
      };
    }
    return {
      wrapper: 'border-amber-500/40 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 shadow-amber-950/20',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: <AlertTriangle className="w-6 h-6 text-amber-400" />,
      actionBox: 'bg-amber-950/30 border-amber-500/30 text-amber-200',
      actionLabel: 'text-amber-400',
    };
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
            {filteredInsights.length} actionable insights synthesized from your verified QuickBooks metrics and advisory models.
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

      {/* Authentic AI Risk Posture Banner */}
      {riskPosture && (
        <div className={`mb-8 border rounded-2xl p-6 shadow-xl ${getRiskPostureStyle(riskPosture.rating).wrapper}`}>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                {getRiskPostureStyle(riskPosture.rating).icon}
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 border rounded-md ${getRiskPostureStyle(riskPosture.rating).badge}`}>
                      {riskPosture.rating} RISK POSTURE
                    </span>
                    {riskPosture.reportRange && (
                      <span className="text-xs text-slate-400">
                        Trailing Period: {riskPosture.reportRange.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1">Executive Risk Assessment</h2>
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                {riskPosture.summary}
              </p>
            </div>

            {riskPosture.topAction && (
              <div className={`p-4 rounded-xl border md:max-w-md w-full ${getRiskPostureStyle(riskPosture.rating).actionBox}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <Target className={`w-4 h-4 ${getRiskPostureStyle(riskPosture.rating).actionLabel}`} />
                  <span className={`text-xs font-bold uppercase tracking-wider ${getRiskPostureStyle(riskPosture.rating).actionLabel}`}>
                    Priority Action Mandate
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-medium leading-relaxed">
                  {riskPosture.topAction}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

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
      <div className="space-y-5">
        {!loading && filteredInsights.length === 0 && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center">
            <Brain className="w-8 h-8 text-violet-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No insights in this category</h3>
            <p className="text-sm text-slate-400">
              No active issues or opportunities detected for the selected filter.
            </p>
          </div>
        )}

        {filteredInsights.map((insight) => {
          const isExpanded = !!expandedTalkingPoints[insight.id];

          return (
            <div
              key={insight.id}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-slate-700/80 transition-all shadow-xl flex flex-col md:flex-row md:items-start justify-between gap-6"
            >
              <div className="flex-1">
                {/* Meta row */}
                <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 px-2.5 py-0.5 bg-teal-500/10 border border-teal-500/20 rounded-md">
                    {insight.category}
                  </span>

                  {getUrgencyBadge(insight.urgency)}

                  <span className="text-xs text-slate-500">
                    {new Date(insight.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="text-base sm:text-lg font-bold text-white mb-2">
                  {insight.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                  {insight.description}
                </p>

                {/* Actionable Recommendations List */}
                {Array.isArray(insight.recommendations) && insight.recommendations.length > 0 && (
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-violet-300 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                      <span>Actionable Recommendations</span>
                    </div>
                    <div className="grid gap-2">
                      {insight.recommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs text-slate-300 flex flex-col sm:flex-row sm:items-start justify-between gap-2"
                        >
                          <div className="flex items-start gap-2 flex-1">
                            <span className="text-violet-400 font-bold">•</span>
                            <span>{rec.action}</span>
                          </div>
                          {rec.expectedImpact && (
                            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded sm:self-start whitespace-nowrap">
                              {rec.expectedImpact}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Advisory Talking Points Toggle */}
                {Array.isArray(insight.talkingPoints) && insight.talkingPoints.length > 0 && (
                  <div className="mt-3">
                    <button
                      onClick={() => toggleTalkingPoints(insight.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {isExpanded ? 'Hide' : 'View'} CFO Strategic Talking Points ({insight.talkingPoints.length})
                      </span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 p-3 bg-slate-950/90 border border-slate-800 rounded-xl space-y-1.5">
                        {insight.talkingPoints.map((tp, idx) => (
                          <div key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                            <span className="text-teal-400 font-bold">›</span>
                            <span>{tp}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Metric Callout Box */}
              {insight.metric && (
                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl md:min-w-[190px]">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
                    {insight.metric}
                  </span>
                  <span className="text-base sm:text-lg font-bold text-emerald-400">
                    {insight.metricValue || 'Tracking'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PortalShell>
  );
}
