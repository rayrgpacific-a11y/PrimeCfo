'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { BillingPeriod } from '@/types/pricing';

export default function LandingPricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');

  return (
    <section id="pricing" className="bg-slate-950 py-24 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Section Heading */}
        <p className="text-teal-400 text-sm font-semibold uppercase tracking-wider mb-3">Pricing</p>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
          Four plans built around how much financial clarity and strategic help you need.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={`text-sm ${billingPeriod === 'monthly' ? 'text-white font-medium' : 'text-slate-400'}`}>
            Monthly
          </span>
          <button
            onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annually' : 'monthly')}
            className="w-12 h-6 bg-slate-800 rounded-full p-1 transition-colors relative"
            aria-label="Toggle Billing Frequency"
          >
            <div
              className={`w-4 h-4 bg-teal-400 rounded-full transition-transform ${
                billingPeriod === 'annually' ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-sm flex items-center gap-1.5 ${billingPeriod === 'annually' ? 'text-white font-medium' : 'text-slate-400'}`}>
            Annually <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Save 10%</span>
          </span>
        </div>

        {/* 4 Pricing Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 text-left">
          
          {/* Tier 1: Starter */}
          <div className="relative p-6 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">Starter</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold text-white">${billingPeriod === 'monthly' ? '59' : '53'}</span>
                <span className="text-sm text-slate-500">/mo</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-6">
                {billingPeriod === 'monthly' ? 'Billed monthly' : '$636 billed annually'}
              </p>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /> 1 QuickBooks Company</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /> Basic P&amp;L &amp; Balance Sheet</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /> Weekly automated sync</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /> Standard AI summary</li>
              </ul>
            </div>
            <Link
              href="/connect?plan=starter"
              className="mt-8 w-full py-2.5 text-center text-sm font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Choose Starter
            </Link>
          </div>

          {/* Tier 2: See */}
          <div className="relative p-6 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">See</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold text-white">${billingPeriod === 'monthly' ? '119' : '107'}</span>
                <span className="text-sm text-slate-500">/mo</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-6">
                {billingPeriod === 'monthly' ? 'Billed monthly' : '$1,284 billed annually'}
              </p>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /> Up to 2 QBO Companies</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /> Real-time daily sync</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /> Cash runway prediction</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /> Anomaly &amp; expense alert triggers</li>
              </ul>
            </div>
            <Link
              href="/connect?plan=see"
              className="mt-8 w-full py-2.5 text-center text-sm font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Choose See
            </Link>
          </div>

          {/* Tier 3: Understand (Most Popular) */}
          <div className="relative p-6 bg-gradient-to-b from-slate-900 to-slate-900/90 border-2 border-teal-500/50 rounded-2xl flex flex-col justify-between shadow-2xl shadow-teal-500/10">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 rounded-full whitespace-nowrap shadow-md">
              Most Popular
            </span>
            <div>
              <p className="text-xs text-teal-300 uppercase tracking-wider font-semibold mb-2">Understand</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold text-white">${billingPeriod === 'monthly' ? '349' : '314'}</span>
                <span className="text-sm text-slate-500">/mo</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-6">
                {billingPeriod === 'monthly' ? 'Billed monthly' : '$3,768 billed annually'}
              </p>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /> Multi-entity support (up to 5)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /> AP/AR aging &amp; collections intelligence</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /> Advanced asset depreciation</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /> Human CPA/CFO review support</li>
              </ul>
            </div>
            <Link
              href="/connect?plan=understand"
              className="mt-8 w-full py-2.5 text-center text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 rounded-xl transition-all shadow-md shadow-teal-500/20"
            >
              Choose Understand
            </Link>
          </div>

          {/* Tier 4: Act */}
          <div className="relative p-6 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">Act</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold text-white">${billingPeriod === 'monthly' ? '699' : '629'}</span>
                <span className="text-sm text-slate-500">/mo</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-6">
                {billingPeriod === 'monthly' ? 'Billed monthly' : '$7,548 billed annually'}
              </p>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /> Unlimited companies &amp; entities</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /> Custom AI fiscal scenarios &amp; models</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /> Dedicated Fractional CFO advisory</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /> 24/7 Priority support &amp; SLA</li>
              </ul>
            </div>
            <Link
              href="/connect?plan=act"
              className="mt-8 w-full py-2.5 text-center text-sm font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Choose Act
            </Link>
          </div>

        </div>

        {/* Link to Full Pricing Page */}
        <div className="mt-12 text-center">
          <Link
            href="/pricing"
            className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-teal-400 hover:to-emerald-400 transition-all shadow-xl shadow-teal-500/25 hover:shadow-teal-500/40"
          >
            See all plans and features
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    </section>
  );
}
