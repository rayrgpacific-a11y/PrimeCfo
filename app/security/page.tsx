'use client';

import React from 'react';
import Link from 'next/link';
import {
  Shield,
  Lock,
  KeyRound,
  Layers,
  Eye,
  Building2,
  Trash2,
  Mail,
  ArrowRight
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function SecurityPage() {
  const practices = [
    {
      title: 'Encryption in transit and at rest',
      description:
        'All traffic uses 256-bit SSL/TLS. Data stored in our database is encrypted at rest by our infrastructure provider.',
      icon: Lock,
    },
    {
      title: 'OAuth-secured QuickBooks connection',
      description:
        'We connect to QuickBooks Online via Intuit’s OAuth flow. We never ask for or store your QuickBooks password. Access tokens are encrypted at rest.',
      icon: KeyRound,
    },
    {
      title: 'Per-tenant data isolation',
      description:
        'Each customer’s books and insights are scoped to their account. Client data is isolated so one tenant cannot access another’s financials.',
      icon: Layers,
    },
    {
      title: 'Read-focused financial access',
      description:
        'PrimeCFO.ai uses QuickBooks report and account data to compute metrics and insights. We do not use your connection to alter your general ledger as part of standard advisory analysis.',
      icon: Eye,
    },
    {
      title: 'Trusted infrastructure partners',
      description:
        'Core services run on recognized providers: Supabase (application data), Stripe (billing), and Plaid where bank-level connections apply. QuickBooks Online connections run exclusively through Intuit developer protocols.',
      icon: Building2,
    },
    {
      title: 'Retention and deletion',
      description:
        'You can disconnect QuickBooks at any time. Disconnecting stops sync and removes stored connection tokens. Account and synced report data can be deleted upon request.',
      icon: Trash2,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-teal-500 selection:text-white font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 lg:pt-28 lg:pb-20">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 -z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/20 via-transparent to-transparent -z-10" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-500/10 border border-teal-500/20 rounded-full mb-6">
            <Shield className="w-4 h-4 text-teal-400" />
            <span className="text-sm text-teal-400 font-medium">Security practices</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4">
            How we protect your books
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Financial data deserves factual controls — not vague badges. Here is what PrimeCFO.ai actually does to keep your information secure.
          </p>
        </div>
      </section>

      {/* Security Practices Grid */}
      <section className="bg-slate-900/60 py-20 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {practices.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all shadow-lg"
                >
                  <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-teal-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Security Contact Section */}
      <section className="bg-slate-950 py-20 border-t border-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-teal-500/20">
            <Mail className="w-6 h-6 text-white" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Security contact</h2>
          <p className="text-slate-400 leading-relaxed mb-8">
            For security questions, vulnerability reports, or data deletion requests, email us directly. We take reports seriously and respond as quickly as we can.
          </p>

          <div className="inline-flex flex-col sm:flex-row items-center gap-4">
            <a
              href="mailto:security@primecfo.ai"
              className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-medium rounded-xl hover:from-teal-400 hover:to-emerald-400 transition-all shadow-lg shadow-teal-500/25 flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              security@primecfo.ai
            </a>
            <Link
              href="/contact"
              className="px-6 py-3 border border-slate-800 text-slate-300 font-medium rounded-xl hover:bg-slate-900 hover:border-slate-700 transition-colors flex items-center gap-2"
            >
              Looking for product help instead? Contact Us
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
