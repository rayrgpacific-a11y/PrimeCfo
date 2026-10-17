'use client';

import React from 'react';
import { DollarSign, TrendingUp, BarChart3, PieChart, Sparkles } from 'lucide-react';

export default function DashboardPreview() {
  return (
    <div className="relative lg:pl-8">
      {/* Decorative ambient glow */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-teal-500/10 via-transparent to-emerald-500/10 blur-2xl" 
      />

      <div className="relative bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-2xl p-6 shadow-2xl shadow-teal-500/5">
        {/* Card Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.18em] font-medium">Financial Overview</p>
            <p className="text-base sm:text-lg font-semibold text-white">Sample Co. · This Month</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Sample data — connect your books to see your real numbers.</p>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Live Demo
          </span>
        </div>

        {/* 4 Metric Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* Revenue */}
          <div className="bg-slate-950/70 rounded-xl p-3.5 border border-slate-800">
            <DollarSign className="w-4 h-4 text-slate-500 mb-1" />
            <p className="text-xl font-bold text-white tabular-nums">$124,500</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-slate-500">Revenue</p>
              <span className="text-[10px] font-semibold text-emerald-400">▲ 8.2%</span>
            </div>
          </div>

          {/* Net Profit */}
          <div className="bg-slate-950/70 rounded-xl p-3.5 border border-slate-800">
            <TrendingUp className="w-4 h-4 text-slate-500 mb-1" />
            <p className="text-xl font-bold text-white tabular-nums">$31,200</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-slate-500">Net Profit</p>
              <span className="text-[10px] font-semibold text-emerald-400">▲ 5.1%</span>
            </div>
          </div>

          {/* Cash Position */}
          <div className="bg-slate-950/70 rounded-xl p-3.5 border border-slate-800">
            <BarChart3 className="w-4 h-4 text-slate-500 mb-1" />
            <p className="text-xl font-bold text-white tabular-nums">$47,800</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-slate-500">Cash Position</p>
              <span className="text-[10px] font-semibold text-emerald-400">▲ 3.2%</span>
            </div>
          </div>

          {/* Profit Margin */}
          <div className="bg-slate-950/70 rounded-xl p-3.5 border border-slate-800">
            <PieChart className="w-4 h-4 text-slate-500 mb-1" />
            <p className="text-xl font-bold text-white tabular-nums">25.1%</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-slate-500">Profit Margin</p>
              <span className="text-[10px] font-semibold text-emerald-400">▲ 1.4%</span>
            </div>
          </div>
        </div>

        {/* SVG Revenue Chart */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-medium">Revenue · last 12 mo</p>
            <p className="text-[10px] text-emerald-400 font-semibold">+18.4% YoY</p>
          </div>
          
          <div className="relative w-full h-[100px]">
            <svg viewBox="0 0 320 90" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="lp-area-landing" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="lp-line-landing" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#2dd4bf" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
              <path
                d="M 4 86 L 32 74 L 60 78 L 89 62 L 117 68 L 145 46 L 174 54 L 202 37 L 230 39 L 259 21 L 287 15 L 316 4 L 316 86 L 4 86 Z"
                fill="url(#lp-area-landing)"
              />
              <path
                d="M 4 86 L 32 74 L 60 78 L 89 62 L 117 68 L 145 46 L 174 54 L 202 37 L 230 39 L 259 21 L 287 15 L 316 4"
                fill="none"
                stroke="url(#lp-line-landing)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* AI Insight Pill */}
        <div className="flex items-start gap-3 rounded-xl border border-teal-500/25 bg-teal-500/10 p-3">
          <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-md shadow-teal-500/20">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-teal-300 font-semibold mb-0.5">AI Insight</p>
            <p className="text-[13px] leading-snug text-slate-200">
              Revenue trending +12% MoM — outpacing your last 4 quarters. Cash runway is healthy at 10.2 months.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
