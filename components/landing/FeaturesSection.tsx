'use client';

import React from 'react';
import {
  Link2,
  BarChart3,
  Brain,
  FileText,
  TrendingUp,
  Shield,
  RefreshCw,
  Users
} from 'lucide-react';
import { landingFeatures } from '@/data/features';

const iconMap = {
  Link2,
  BarChart3,
  Brain,
  FileText,
  TrendingUp,
  Shield,
  RefreshCw,
  Users,
};

export default function FeaturesSection() {
  return (
    <section id="features" className="bg-slate-950 py-24 border-t border-slate-900 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center mb-16">
          <p className="text-teal-400 text-sm font-semibold uppercase tracking-wider mb-3">Features</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Everything You Need to Understand Your Finances
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            From automated data retrieval to AI-powered predictive analysis.
          </p>
        </div>

        {/* 8 Feature Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {landingFeatures.map((feature) => {
            const IconComponent = iconMap[feature.iconName];

            return (
              <div
                key={feature.title}
                className={`group bg-slate-900/60 border border-slate-800 rounded-xl p-6 hover:border-slate-700 hover:bg-slate-900 transition-all duration-300 hover:shadow-xl ${feature.shadowColor}`}
              >
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
