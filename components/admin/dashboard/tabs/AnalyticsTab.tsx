'use client';

import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  FileSpreadsheet, 
  BarChart3, 
  TrendingUp, 
  PieChart 
} from 'lucide-react';
import { AnalyticsData } from '@/types/admin';
import { formatCurrency, formatPercent } from '@/lib/admin-utils';

interface AnalyticsTabProps {
  analyticsData: AnalyticsData;
}

export default function AnalyticsTab({ analyticsData }: AnalyticsTabProps) {
  return (
    <div className="space-y-6">
      {/* 8 KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 hover:border-slate-700 transition-all shadow-lg">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1">Gross Margin</p>
          <p className="text-xl sm:text-2xl font-bold text-white tracking-tight tabular-nums">{formatPercent(analyticsData.kpis.grossMargin)}</p>
          <div className={`flex items-center gap-1 mt-1 text-xs font-semibold ${
            analyticsData.kpis.grossMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {analyticsData.kpis.grossMargin >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            <span>{analyticsData.kpis.grossMargin > 0 ? 'Operating Margin' : 'Baseline'}</span>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 hover:border-slate-700 transition-all shadow-lg">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1">Net Margin</p>
          <p className="text-xl sm:text-2xl font-bold text-white tracking-tight tabular-nums">{formatPercent(analyticsData.kpis.netMargin)}</p>
          <div className={`flex items-center gap-1 mt-1 text-xs font-semibold ${
            analyticsData.kpis.netMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {analyticsData.kpis.netMargin >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            <span>{analyticsData.kpis.netMargin >= 0 ? 'Profitable' : 'Deficit'}</span>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 hover:border-slate-700 transition-all shadow-lg">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1">Current Ratio</p>
          <p className="text-xl sm:text-2xl font-bold text-teal-400 tracking-tight tabular-nums">
            {analyticsData.kpis.currentRatio > 0 ? `${analyticsData.kpis.currentRatio.toFixed(1)}x` : '—'}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            {analyticsData.kpis.currentRatio >= 1 ? 'Solvency: Optimal' : 'Awaiting Balance Sheet'}
          </span>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 hover:border-slate-700 transition-all shadow-lg">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1">Quick Ratio</p>
          <p className="text-xl sm:text-2xl font-bold text-cyan-400 tracking-tight tabular-nums">
            {analyticsData.kpis.quickRatio > 0 ? `${analyticsData.kpis.quickRatio.toFixed(1)}x` : '—'}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            {analyticsData.kpis.quickRatio >= 1 ? 'Liquidity: Strong' : 'Awaiting Balance Sheet'}
          </span>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 hover:border-slate-700 transition-all shadow-lg">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1">DSO (Receivables)</p>
          <p className="text-xl sm:text-2xl font-bold text-white tracking-tight tabular-nums">
            {analyticsData.kpis.dso > 0 ? `${analyticsData.kpis.dso} Days` : '—'}
          </p>
          <span className="text-xs text-slate-400 mt-1 block font-medium">
            {analyticsData.kpis.dso > 45 ? 'Needs collection review' : 'Receivables cycle'}
          </span>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 hover:border-slate-700 transition-all shadow-lg">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1">DPO (Payables)</p>
          <p className="text-xl sm:text-2xl font-bold text-white tracking-tight tabular-nums">
            {analyticsData.kpis.dpo > 0 ? `${analyticsData.kpis.dpo} Days` : '—'}
          </p>
          <span className="text-xs text-slate-400 mt-1 block font-medium">
            {analyticsData.kpis.dpo > 0 ? 'Payables schedule' : 'Terms pending'}
          </span>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 hover:border-slate-700 transition-all shadow-lg">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1">Monthly Burn Rate</p>
          <p className="text-xl sm:text-2xl font-bold text-rose-400 tracking-tight tabular-nums">{formatCurrency(analyticsData.kpis.burnRate)}</p>
          <span className="text-xs text-slate-400 mt-1 block">Current monthly outflow</span>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 hover:border-slate-700 transition-all shadow-lg">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1">Cash Runway</p>
          <p className="text-xl sm:text-2xl font-bold text-emerald-400 tracking-tight tabular-nums">
            {analyticsData.kpis.runway > 0 ? `${analyticsData.kpis.runway.toFixed(1)} mo` : '—'}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">At current cash position</span>
        </div>
      </div>

      {/* Charts & Budget Variance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses Trend */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-white tracking-tight">Revenue vs. Expenses Velocity</h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-slate-300">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="text-slate-300">Expenses</span>
              </div>
            </div>
          </div>

          <div className="h-56 flex items-end justify-between gap-4 pt-4">
            {analyticsData.trends.revenue.length > 0 ? (
              analyticsData.trends.revenue.map((item, idx) => {
                const maxVal = Math.max(
                  ...analyticsData.trends.revenue.map(r => r.value),
                  ...analyticsData.trends.expenses.map(e => e.value),
                  1
                );
                const expVal = analyticsData.trends.expenses[idx]?.value || 0;
                const revPercent = Math.min(100, Math.max(4, (item.value / maxVal) * 100));
                const expPercent = Math.min(100, Math.max(4, (expVal / maxVal) * 100));

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full h-44 flex items-end justify-center gap-1.5">
                      <div 
                        className="w-1/2 bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-md transition-all hover:opacity-90"
                        style={{ height: `${revPercent}%` }}
                        title={`Revenue: ${formatCurrency(item.value)}`}
                      />
                      <div 
                        className="w-1/2 bg-gradient-to-t from-rose-500 to-amber-500 rounded-t-md transition-all hover:opacity-90"
                        style={{ height: `${expPercent}%` }}
                        title={`Expenses: ${formatCurrency(expVal)}`}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">{item.month}</span>
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
                <span>No historical trajectory records available yet.</span>
              </div>
            )}
          </div>
        </div>

        {/* Budget vs Actual Variance */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 shadow-lg">
          <h3 className="text-base font-semibold text-white tracking-tight mb-6">Budget Variance (YTD Performance)</h3>
          
          <div className="space-y-6">
            <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-white">Target Revenue Variance</span>
                <span className={`font-bold font-mono ${
                  analyticsData.budgetVariance.revenue.variance < 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {analyticsData.budgetVariance.revenue.variance}% vs Target
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Actual: <strong className="text-white font-mono">{formatCurrency(analyticsData.budgetVariance.revenue.actual)}</strong></span>
                <span>Budget: <strong className="text-slate-300 font-mono">{formatCurrency(analyticsData.budgetVariance.revenue.budget)}</strong></span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-teal-500 to-emerald-400 h-2 rounded-full" 
                  style={{ width: `${analyticsData.budgetVariance.revenue.budget > 0 ? Math.min(100, (analyticsData.budgetVariance.revenue.actual / analyticsData.budgetVariance.revenue.budget) * 100) : 0}%` }}
                />
              </div>
            </div>

            <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-white">Operating Expense Discipline</span>
                <span className={`font-bold font-mono ${
                  analyticsData.budgetVariance.expenses.variance > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  +{analyticsData.budgetVariance.expenses.variance}% Variance
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Actual: <strong className="text-white font-mono">{formatCurrency(analyticsData.budgetVariance.expenses.actual)}</strong></span>
                <span>Budget: <strong className="text-slate-300 font-mono">{formatCurrency(analyticsData.budgetVariance.expenses.budget)}</strong></span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-rose-500 to-amber-500 h-2 rounded-full" 
                  style={{ width: `${analyticsData.budgetVariance.expenses.budget > 0 ? Math.min(100, (analyticsData.budgetVariance.expenses.actual / analyticsData.budgetVariance.expenses.budget) * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Statement Generators */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 shadow-lg">
        <h3 className="text-base font-semibold text-white tracking-tight mb-4">Financial Intelligence Reports</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <button type="button" className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl hover:border-teal-500/50 hover:bg-slate-800/70 transition-all text-left cursor-pointer group">
            <FileSpreadsheet className="w-5 h-5 text-teal-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="font-semibold text-sm text-white">Profit & Loss Statement</h4>
            <p className="text-[11px] text-slate-400 mt-1">GAAP compliant statement for period</p>
          </button>

          <button type="button" className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl hover:border-emerald-500/50 hover:bg-slate-800/70 transition-all text-left cursor-pointer group">
            <BarChart3 className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="font-semibold text-sm text-white">Balance Sheet</h4>
            <p className="text-[11px] text-slate-400 mt-1">Assets, liabilities, and retained equity</p>
          </button>

          <button type="button" className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl hover:border-cyan-500/50 hover:bg-slate-800/70 transition-all text-left cursor-pointer group">
            <TrendingUp className="w-5 h-5 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="font-semibold text-sm text-white">Cash Flow Statement</h4>
            <p className="text-[11px] text-slate-400 mt-1">Operating, investing, and financing flows</p>
          </button>

          <button type="button" className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl hover:border-violet-500/50 hover:bg-slate-800/70 transition-all text-left cursor-pointer group">
            <PieChart className="w-5 h-5 text-violet-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="font-semibold text-sm text-white">Custom KPI Builder</h4>
            <p className="text-[11px] text-slate-400 mt-1">Unit economics & custom metrics</p>
          </button>
        </div>
      </div>
    </div>
  );
}
