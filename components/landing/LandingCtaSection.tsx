'use client';

import React from 'react';
import Link from 'next/link';
import { Zap, ArrowRight } from 'lucide-react';

export default function LandingCtaSection() {
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
          Ready to Understand Your Finances?
        </h2>
        <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
          Join business owners who use PrimeCFO.ai to make smarter, high-impact financial decisions.
        </p>

        <Link
          href="/connect"
          className="group px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-teal-400 hover:to-emerald-400 transition-all shadow-xl shadow-teal-500/25 hover:shadow-teal-500/40 inline-flex items-center gap-2"
        >
          Get Started Free
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </section>
  );
}
