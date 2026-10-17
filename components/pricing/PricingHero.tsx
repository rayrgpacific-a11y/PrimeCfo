'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { BillingPeriod } from '@/types/pricing';

interface PricingHeroProps {
  billingPeriod: BillingPeriod;
  onToggleBilling: (period: BillingPeriod) => void;
}

export default function PricingHero({ billingPeriod, onToggleBilling }: PricingHeroProps) {
  return (
    <section className="relative overflow-hidden pt-16 pb-16 lg:pt-20 lg:pb-20">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/20 via-transparent to-transparent -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-500/10 border border-teal-500/20 rounded-full mb-6">
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span className="text-xs sm:text-sm text-teal-400 font-medium">14-Day Free Trial · Card Required</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-4">
          Pricing
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-10">
          Four simple paths — keep your numbers visible, see them clearly, understand them with help, or act with a team in your corner.
        </p>

        {/* Billing Frequency Toggle */}
        <div className="inline-flex items-center bg-slate-900/80 border border-slate-800 p-1.5 rounded-2xl shadow-xl mb-12">
          <button
            onClick={() => onToggleBilling('monthly')}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              billingPeriod === 'monthly'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => onToggleBilling('annually')}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              billingPeriod === 'annually'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Annual Billing</span>
            <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
              Save 10%
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
