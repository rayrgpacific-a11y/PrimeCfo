'use client';

import React from 'react';
import Link from 'next/link';
import { Zap, Sliders, Users, Briefcase } from 'lucide-react';
import { decisionGuideTiers } from '@/data/pricing';

export default function DecisionGuideSection() {
  const guideIcons = [
    <Zap key="zap" className="w-5 h-5 text-teal-400" />,
    <Sliders key="sliders" className="w-5 h-5 text-teal-400" />,
    <Users key="users" className="w-5 h-5 text-teal-400" />,
    <Briefcase key="briefcase" className="w-5 h-5 text-teal-400" />
  ];

  const pricingPills = [
    'Starter — $53/mo billed annually ($59 monthly)',
    'See — $107/mo billed annually ($119 monthly)',
    'Understand — $314/mo billed annually ($349 monthly)',
    'Act — $629/mo billed annually ($699 monthly)'
  ];

  const tierIds = ['starter', 'see', 'understand', 'act'];

  return (
    <section className="bg-slate-900/60 border-y border-slate-800/80 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center mb-12">
          <p className="text-teal-400 text-xs uppercase tracking-widest font-semibold mb-2">Decision Guide</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Not sure which tier is right?
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Here&apos;s the simple version: choose based on how much you want us involved.
          </p>
        </div>

        {/* 4 Decision Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {decisionGuideTiers.map((tier, idx) => (
            <Link
              key={tier.title}
              href={`/signup?plan=${tierIds[idx]}`}
              className="p-6 bg-slate-950/80 border border-slate-800/90 rounded-2xl shadow-xl flex flex-col justify-between hover:border-teal-500/50 hover:bg-slate-900/80 transition-all group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  {guideIcons[idx]}
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2">
                  {tier.subtitle}
                </h3>
                
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  {tier.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/60">
                <span className="inline-block w-full py-1.5 px-2.5 rounded-lg text-center text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                  {pricingPills[idx]}
                </span>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}

