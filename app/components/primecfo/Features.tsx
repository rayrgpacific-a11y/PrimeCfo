"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PLANS } from "@/app/lib/pricing-plans";
import TrustStrip from "./TrustStrip";
import {
  Link2,
  BarChart3,
  Brain,
  Shield,
  RefreshCw,
  Users,
  ArrowRight,
  Zap,
  FileText,
  TrendingUp,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  AlertTriangle,
} from "lucide-react";

interface FeaturesProps {
  onGetStarted: () => void;
}

const Features: React.FC<FeaturesProps> = ({ onGetStarted }) => {
  const [annual, setAnnual] = useState(false);

  const steps = [
    {
      num: "1",
      title: "Connect QuickBooks",
      desc: "One-click OAuth 2.0 authorization links your QuickBooks Online company in under 60 seconds with zero password exposure.",
    },
    {
      num: "2",
      title: "Automated Data Ingestion",
      desc: "PrimeCFO.ai retrieves your complete general ledger, Profit & Loss, Balance Sheet, and aging schedules directly from QuickBooks.",
    },
    {
      num: "3",
      title: "Deterministic & AI Analysis",
      desc: "The engine runs 58 financial sanity checks, projects cash runway, isolates overdue AR, and summarizes key trends.",
    },
    {
      num: "4",
      title: "Decisive Executive Action",
      desc: "Review your live financial dashboard, export board-ready PDFs, and receive scheduled summaries directly in your inbox.",
    },
  ];

  return (
    <div className="bg-slate-950 text-slate-100">
      {/* ------------------------------------------------------------------ */}
      {/* SECTION 1: CORE CAPABILITIES (BENTO GRID)                          */}
      {/* ------------------------------------------------------------------ */}
      <section id="features" className="py-24 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight mb-4">
              Everything You Need to Command Your Company Finances
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              Eliminate spreadsheet clutter. PrimeCFO combines deterministic accounting math with generative intelligence to surface what matters right now.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Bento Flagship 1: Cash Runway & Liquidity */}
            <div className="lg:col-span-7 rounded-2xl bg-slate-900/40 border border-slate-800 p-8 flex flex-col justify-between hover:border-slate-700/80 transition-colors">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-medium mb-6">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Live Liquidity Intelligence
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">
                  Real-Time Cash Runway & Burn Rate
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-xl">
                  Always know exactly how many months of operational runway you have left. The engine tracks your live bank balances against average net burn, alerting you before cash dips below safe buffers.
                </p>
              </div>

              {/* Visual Mini Mockup */}
              <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-5 font-mono text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
                  <span className="text-slate-400 font-sans font-medium text-xs">Liquidity Status</span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-sans font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Healthy Buffer
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 text-center">
                  <div>
                    <div className="text-[11px] text-slate-500 font-sans uppercase tracking-wider mb-1">Cash Balance</div>
                    <div className="text-base font-bold text-white font-sans">$124,500</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 font-sans uppercase tracking-wider mb-1">Monthly Burn</div>
                    <div className="text-base font-bold text-white font-sans">$12,960</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 font-sans uppercase tracking-wider mb-1">Runway</div>
                    <div className="text-base font-bold text-teal-400 font-sans">9.6 Months</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Flagship 2: AI Financial Analysis */}
            <div className="lg:col-span-5 rounded-2xl bg-slate-900/40 border border-slate-800 p-8 flex flex-col justify-between hover:border-slate-700/80 transition-colors">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-medium mb-6">
                  <Brain className="w-3.5 h-3.5" />
                  Grounded AI Summaries
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">
                  Plain-English Executive Insights
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  No confusing accounting jargon. Every observation is cross-referenced with your verified ledger data, highlighting revenue spikes, gross margin contractions, and delinquent receivables.
                </p>
              </div>

              <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-slate-300 leading-snug">
                    <strong className="text-white">Revenue Momentum:</strong> Up +12.4% MoM driven by recurring client billings.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-slate-300 leading-snug">
                    <strong className="text-white">Accounts Receivable:</strong> $15,985 past 60 days. Follow up with top 2 clients to maintain cash velocity.
                  </p>
                </div>
              </div>
            </div>

            {/* Sub-card 1: Automated 3-Statement Sync */}
            <div className="lg:col-span-3 rounded-2xl bg-slate-900/30 border border-slate-800/80 p-6 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-white mb-2">Automated Financials</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Profit & Loss, Balance Sheet, and Cash Flow compiled and synced on Cash or Accrual basis with zero manual imports.
              </p>
            </div>

            {/* Sub-card 2: AR Aging */}
            <div className="lg:col-span-3 rounded-2xl bg-slate-900/30 border border-slate-800/80 p-6 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-white mb-2">Aging Schedules</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Track 30, 60, 90, and 90+ day accounts receivable and payable to catch liquidity bottlenecks before they escalate.
              </p>
            </div>

            {/* Sub-card 3: Multi-Entity Support */}
            <div className="lg:col-span-3 rounded-2xl bg-slate-900/30 border border-slate-800/80 p-6 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-white mb-2">Multi-Client Portfolios</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Designed for business operators and accounting firms managing multiple entities or corporate subsidiaries from one view.
              </p>
            </div>

            {/* Sub-card 4: Bank-Grade Security */}
            <div className="lg:col-span-3 rounded-2xl bg-slate-900/30 border border-slate-800/80 p-6 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-white mb-2">AES-256 Cryptographic Vault</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                All QuickBooks OAuth tokens encrypted at rest with AES-256-GCM. Row-level multi-tenant database isolation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 2: HOW IT WORKS (CONNECTED STEPPER)                        */}
      {/* ------------------------------------------------------------------ */}
      <section id="how-it-works" className="py-24 border-t border-slate-900 bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
              From QuickBooks to Board-Ready Clarity in Four Steps
            </h2>
            <p className="text-base text-slate-400 leading-relaxed">
              Getting started requires zero data migration and no IT provisioning. Connect your accounting software and get clarity immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {steps.map((s, idx) => (
              <div key={s.title} className="relative flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-400 font-bold text-sm mb-5">
                    {s.num}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2.5 tracking-tight">{s.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 3: TRUST STRIP & INTEGRATIONS                              */}
      {/* ------------------------------------------------------------------ */}
      <TrustStrip />

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 4: PRICING SECTION WITH INTERACTIVE TOGGLE                 */}
      {/* ------------------------------------------------------------------ */}
      <section id="pricing" className="py-24 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-base text-slate-400 leading-relaxed mb-8">
              Four flexible tiers scaled to your stage. Every plan includes a 14-day free trial.
            </p>

            {/* Interactive Billing Toggle */}
            <div
              role="radiogroup"
              aria-label="Billing frequency toggle"
              className="inline-flex items-center gap-1.5 p-1.5 rounded-full bg-slate-900 border border-slate-800"
            >
              <button
                type="button"
                role="radio"
                aria-checked={!annual}
                onClick={() => setAnnual(false)}
                className={`px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  !annual ? "bg-teal-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={annual}
                onClick={() => setAnnual(true)}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  annual ? "bg-teal-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
                }`}
              >
                <span>Annual Billing</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  annual ? "bg-slate-950 text-teal-300" : "bg-teal-500/20 text-teal-300"
                }`}>
                  Save 10%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {PLANS.map((plan) => {
              const price = annual ? plan.annual : plan.monthly;
              const savings = (plan.monthly - plan.annual) * 12;

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col justify-between rounded-2xl p-7 transition-all duration-200 ${
                    plan.popular
                      ? "bg-slate-900/80 border-2 border-teal-500/80 shadow-xl shadow-teal-500/10"
                      : "bg-slate-900/40 border border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-teal-400 text-slate-950 rounded-full whitespace-nowrap shadow-sm">
                      Most Popular
                    </span>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-teal-400">
                        {plan.tierWordmark}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-3xl font-bold text-white tracking-tight">${price}</span>
                      <span className="text-xs text-slate-400">/mo</span>
                    </div>

                    {annual && savings > 0 ? (
                      <p className="text-[11px] font-medium text-teal-400 mb-4">
                        Save ${savings.toLocaleString()}/year
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-500 mb-4">
                        Billed monthly
                      </p>
                    )}

                    <p className="text-xs text-slate-300 font-medium mb-6">{plan.headline}</p>

                    <div className="h-px w-full bg-slate-800/80 mb-6" />

                    <ul className="space-y-2.5 mb-8">
                      {plan.cardBullets.slice(0, 4).map((bullet) => (
                        <li key={bullet} className="flex items-start gap-2.5 text-xs text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 mt-0.5 shrink-0" />
                          <span className="leading-snug">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <Link
                      href={`/pricing?plan=${plan.id}&interval=${annual ? "year" : "month"}`}
                      className={`w-full py-3 px-4 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all ${
                        plan.popular
                          ? "bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md shadow-teal-500/20"
                          : "border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-white"
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <p className="text-[10px] text-slate-500 text-center mt-2">
                      14-day trial · Card required
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 text-sm font-medium text-teal-400 hover:text-teal-300 transition-colors"
            >
              Compare all features and enterprise details in full matrix
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 5: FINAL PRE-FOOTER CALL TO ACTION                        */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-20 border-t border-slate-900 bg-gradient-to-b from-slate-950 to-slate-900/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
            Ready to Unlock Potential Through Financial Intelligence?
          </h2>
          <p className="text-base text-slate-400 max-w-xl mx-auto mb-8">
            Connect your QuickBooks Online account in 60 seconds and experience clear, board-grade financial insight today.
          </p>
          <button
            type="button"
            onClick={onGetStarted}
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold rounded-xl transition-all duration-200 shadow-xl shadow-teal-500/25 cursor-pointer active:scale-[0.99]"
          >
            Start Free 14-Day Trial
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default Features;
