'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Lock, CheckCircle2, Building, ArrowRight } from 'lucide-react';

export default function SecurityBannerSection() {
  const securityPillars = [
    {
      title: '256-Bit SSL/TLS',
      description: 'All financial transfers are encrypted with AES-256 standard protocols both in transit and at rest.',
      icon: Shield
    },
    {
      title: 'OAuth 2.0 Auth',
      description: 'We connect directly via Intuit OAuth. Your banking and QuickBooks login credentials are never seen or stored.',
      icon: Lock
    },
    {
      title: 'Read-Only Scoping',
      description: 'Our AI models operate on strict read-only financial queries. We can never alter, delete, or modify your books.',
      icon: CheckCircle2
    },
    {
      title: 'Tenant Isolation',
      description: 'Client databases are isolated with strict Row-Level Security (RLS) ensuring total privacy between organizations.',
      icon: Building
    }
  ];

  return (
    <section id="security" className="bg-slate-950 py-24 border-t border-slate-900 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center mb-16">
          <p className="text-teal-400 text-sm font-semibold uppercase tracking-wider mb-3">Security &amp; Privacy</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Bank-Level Security at Every Layer</h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            We know your financial data is mission-critical. PrimeCFO.ai is engineered with bank-grade encryption and read-only protocol protections.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {securityPillars.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors shadow-lg"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30 rounded-xl flex items-center justify-center mb-4 text-teal-400">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>

        {/* Link to Full Security Details */}
        <div className="text-center">
          <Link
            href="/security"
            className="inline-flex items-center gap-2 text-sm text-teal-400 hover:text-teal-300 font-medium transition-colors"
          >
            Learn more about our enterprise security architecture
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
}
