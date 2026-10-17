'use client';

import React from 'react';
import { workflowSteps } from '@/data/features';

export default function WorkflowSection() {
  return (
    <section id="how-it-works" className="bg-slate-900 py-24 border-t border-slate-800 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center mb-16">
          <p className="text-teal-400 text-sm font-semibold uppercase tracking-wider mb-3">How It Works</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            From QuickBooks to Insights in Minutes
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Four simple steps to transform raw accounting data into executive strategy.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {workflowSteps.map((step) => (
            <div key={step.step} className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30 rounded-2xl mb-5 group-hover:scale-105 transition-transform duration-200">
                <span className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                  {step.step}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">{step.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
