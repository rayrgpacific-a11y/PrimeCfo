'use client';

import React from 'react';
import Link from 'next/link';
import { Zap, ArrowRight } from 'lucide-react';

export default function PricingCtaSection() {
  return (
    <section className="bg-slate-900 py-20 relative overflow-hidden border-t border-slate-800">
      <div 
        aria-hidden="true" 
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-900/20 via-transparent to-transparent pointer-events-none" 
      />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-500/10 border border-teal-500/20 rounded-full mb-6">
          <Zap className="w-4 h-4 text-teal-400" />
          <span className="text-sm text-teal-400 font-medium">14-Day Free Trial</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Ready to see your numbers clearly?
        </h2>
        <p className="text-base sm:text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
          Every plan includes a 14-day free trial with card required. Billing starts on day 15 unless you cancel during the trial.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup?plan=understand"
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-teal-400 hover:to-emerald-400 transition-all shadow-xl shadow-teal-500/25 hover:shadow-teal-500/40 inline-flex items-center justify-center gap-2"
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="mailto:andrew@primeaccsolutions.com?subject=PrimeCFO%20Consultation"
            className="w-full sm:w-auto px-8 py-4 bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white font-semibold rounded-xl transition-colors inline-flex items-center justify-center gap-2"
          >
            Book a Consultation
          </a>
        </div>
      </div>
    </section>
  );
}
