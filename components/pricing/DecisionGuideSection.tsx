'use client';

import React from 'react';
import { decisionGuideTiers } from '@/data/pricing';

export default function DecisionGuideSection() {
  return (
    <section className="bg-slate-900/60 border-y border-slate-800/80 py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center mb-12">
          <p className="text-teal-400 text-xs uppercase tracking-widest font-semibold mb-2">Decision Guide</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Not sure which tier is right?
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Match your current operational style to the plan built for you.
          </p>
        </div>

        {/* 4 Decision Cards Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {decisionGuideTiers.map((tier) => (
            <div key={tier.title} className="p-5 bg-slate-950/80 border border-slate-800 rounded-xl shadow-lg">
              <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider block mb-1">
                {tier.subtitle} &rarr; {tier.title}
              </span>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {tier.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
