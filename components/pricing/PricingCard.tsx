'use client';

import React, { useState } from 'react';
import { CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { PricingTier, BillingPeriod } from '@/types/pricing';

interface PricingCardProps {
  plan: PricingTier;
  billingPeriod: BillingPeriod;
}

export default function PricingCard({ plan, billingPeriod }: PricingCardProps) {
  const [loading, setLoading] = useState(false);
  const currentPrice = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice;

  const handleStartCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          billingPeriod,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (data.url) {
        window.location.href = data.url;
        return;
      }
    } catch (err) {
      console.warn('Stripe checkout error, redirecting to signup:', err);
    }

    // Fallback to signup with plan and billing parameters
    window.location.href = `/signup?plan=${encodeURIComponent(plan.id)}&billing=${billingPeriod}`;
  };

  return (
    <div
      className={`relative rounded-2xl flex flex-col justify-between p-6 sm:p-7 transition-all duration-200 ${
        plan.popular
          ? 'bg-slate-900 border-2 border-teal-500 shadow-2xl shadow-teal-500/10'
          : 'bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80'
      }`}
    >
      {/* Most Popular Badge */}
      {plan.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-full shadow-md whitespace-nowrap">
          Most Popular
        </span>
      )}

      <div>
        {/* Tier Name & Tagline */}
        <div className="mb-4">
          <h3 className="text-sm font-bold tracking-wider uppercase text-teal-400 mb-1">
            {plan.name}
          </h3>
          <p className="text-xs text-slate-400 min-h-[32px]">{plan.tagline}</p>
        </div>

        {/* Pricing Figures */}
        <div className="mb-5 pb-5 border-b border-slate-800">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl sm:text-4xl font-bold text-white tabular-nums">
              ${currentPrice}
            </span>
            <span className="text-sm text-slate-400 font-medium">/mo</span>
          </div>

          <p className="text-xs text-slate-400 mt-1.5">
            {billingPeriod === 'monthly' ? (
              'Billed monthly'
            ) : (
              <span className="text-emerald-400 font-medium">
                Save ${plan.annualSavings}/yr · ${currentPrice * 12}/yr
              </span>
            )}
          </p>
        </div>

        {/* Features Checklist */}
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
          What&apos;s Included:
        </p>
        <ul className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Card Actions */}
      <div className="pt-6 mt-6 border-t border-slate-800/60">
        <button
          type="button"
          onClick={handleStartCheckout}
          disabled={loading}
          className={`w-full py-3 px-4 rounded-xl text-center text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
            plan.popular
              ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-400 hover:to-emerald-400 shadow-lg shadow-teal-500/25'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
          }`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>{plan.ctaText}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {plan.secondaryCta && (
          <a
            href={plan.secondaryCta.href}
            className="block text-center text-xs text-teal-400 hover:text-teal-300 mt-2.5 underline underline-offset-4"
          >
            {plan.secondaryCta.text}
          </a>
        )}

        <p className="text-[10px] text-center text-slate-500 mt-3">
          14-day free trial · card required
        </p>
      </div>
    </div>
  );
}
