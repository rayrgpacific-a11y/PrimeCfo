"use client";

import React from "react";
import { Shield, Zap, ArrowRight, CheckCircle2 } from "lucide-react";
import DashboardPreview from "./DashboardPreview";

interface HeroProps {
  onGetStarted: () => void;
}

const Hero: React.FC<HeroProps> = ({ onGetStarted }) => {
  return (
    <div className="relative overflow-hidden bg-slate-950">
      {/* Ambient background lighting */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-teal-500/10 blur-[128px]" />
        <div className="absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-emerald-500/10 blur-[128px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-24 lg:pt-24 lg:pb-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-300 text-xs font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
              </span>
              Intuit QuickBooks Certified OAuth 2.0 Integration
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1] mb-6">
              Connect Your Books.{" "}
              <span className="text-teal-400">
                Unlocking Potential Through Financial Intelligence
                <sup className="text-[0.45em] font-normal align-super text-teal-300 ml-1">™</sup>
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed mb-8 max-w-xl">
              PrimeCFO.ai connects to your QuickBooks account and translates raw ledger data into clear,
              actionable business intelligence — so you can make confident executive decisions without an accounting degree.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <button
                type="button"
                onClick={onGetStarted}
                className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 active:scale-[0.99] cursor-pointer"
              >
                Connect QuickBooks Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                type="button"
                onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex items-center justify-center gap-2 px-7 py-4 border border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-200 font-medium rounded-xl transition-colors cursor-pointer"
              >
                See How It Works
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-800/60 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-400" />
                <span>256-bit AES Token Vault</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-teal-400" />
                <span>Live Ledger Synchronization</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>14-Day Full Trial · Cancel Anytime</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <DashboardPreview />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
