'use client';

import React from 'react';
import Link from 'next/link';
import {
  Compass,
  Heart,
  ShieldCheck,
  Sparkles,
  Users,
  TrendingUp,
  Target,
  ArrowRight,
  Zap,
  Shield,
  Lock
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-teal-500 selection:text-white font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 lg:pt-28 lg:pb-20">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 -z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-900/20 via-transparent to-transparent -z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/15 via-transparent to-transparent -z-10" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-500/10 border border-teal-500/20 rounded-full mb-8">
            <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
            <span className="text-sm text-teal-400 font-medium">About PrimeCFO.ai</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-white leading-tight mb-6 tracking-tight">
            Built by accountants.{' '}
            <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent whitespace-nowrap">
              Powered by AI.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
            PrimeCFO.ai — Unlocking Potential Through Financial Intelligence
            <sup className="text-[0.45em] font-normal align-super text-emerald-300/95 ml-0.5">™</sup>
          </p>
        </div>
      </section>

      {/* Origin Section */}
      <section className="bg-slate-900 py-20 border-t border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-start">
            <div>
              <p className="text-teal-400 text-sm font-semibold uppercase tracking-wider mb-3">Our origin</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Built by accountants who live in the books.
              </h2>
              <p className="text-slate-400 leading-relaxed mb-4">
                PrimeCFO.ai wasn&apos;t built by a software company guessing at what owners need. It was built by{' '}
                <a
                  href="https://primeaccsolutions.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-400 hover:text-teal-300 underline decoration-teal-500/40 underline-offset-4 transition-colors"
                >
                  Prime Accounting Solutions, LLC
                </a>{' '}
                — a firm that has spent 20 years in the books of small businesses.
              </p>
              <p className="text-slate-400 leading-relaxed">
                Every insight, alert, and forecast in the product started as a question a real client asked us.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg">
                <p className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                  100%
                </p>
                <p className="text-xs text-slate-400 mt-2 leading-snug">QuickBooks-native data</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg">
                <p className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                  &lt;60s
                </p>
                <p className="text-xs text-slate-400 mt-2 leading-snug">From connect to first insight</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg">
                <p className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                  4
                </p>
                <p className="text-xs text-slate-400 mt-2 leading-snug">Plans from $59/mo (save 10% annually)</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg">
                <p className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                  20 yrs
                </p>
                <p className="text-xs text-slate-400 mt-2 leading-snug">Of accounting experience behind the product</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI + HI Section */}
      <section className="bg-slate-950 py-20 border-t border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <p className="text-teal-400 text-sm font-semibold uppercase tracking-wider mb-3">AI + HI</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Artificial intelligence + human intelligence.
            </h2>
          </div>

          <div className="max-w-3xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/50 p-8 sm:p-10 text-center shadow-xl">
            <p className="text-slate-300 leading-relaxed text-lg">
              The AI reads your books every day; our human experience decides what&apos;s worth telling you. Software finds the patterns. Accountants make them mean something.
            </p>
          </div>
        </div>
      </section>

      {/* Principles Section */}
      <section className="bg-slate-900 py-20 border-t border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-teal-400 text-sm font-semibold uppercase tracking-wider mb-3">What we believe</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">The principles behind the product</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              We build PrimeCFO.ai around a few convictions that shape every feature.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="group bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 hover:bg-slate-900 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Compass className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Clarity over complexity</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Financial software shouldn&apos;t require an accounting degree. We translate numbers into plain language so owners can act with confidence.
              </p>
            </div>

            <div className="group bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 hover:bg-slate-900 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Built for business owners</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                We design for the people running the business — not the people reconciling its books. Every feature starts with a real owner question.
              </p>
            </div>

            <div className="group bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 hover:bg-slate-900 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Security is non-negotiable</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Your books are sensitive. We encrypt data in transit and at rest, isolate every tenant, and connect to QuickBooks via OAuth — we never store your passwords.
              </p>
            </div>

            <div className="group bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 hover:bg-slate-900 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">AI that&apos;s accountable</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Every insight ties back to real numbers from your general ledger. No hallucinations, no vague advice — just analysis you can trace.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Audience Section */}
      <section className="bg-slate-950 py-20 border-t border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-teal-400 text-sm font-semibold uppercase tracking-wider mb-3">Who it’s for</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Built for owners, advisors, and the teams in between
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-4">
                <Users className="w-5 h-5 text-teal-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Business owners</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Get a CFO-style read on your business without hiring one. Understand cash, revenue, and margin at a glance.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5 text-teal-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Accounting firms</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Deliver proactive advisory across your book of business. One dashboard for every client you serve.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-4">
                <Target className="w-5 h-5 text-teal-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Fractional CFOs</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Spend less time building reports and more time advising. PrimeCFO.ai automates the baseline so you can focus on strategy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-900 py-20 relative overflow-hidden border-t border-slate-800/80">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-900/20 via-transparent to-transparent -z-10" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-500/10 border border-teal-500/20 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span className="text-sm text-teal-400 font-medium">AI-powered, owner-friendly</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Want to see PrimeCFO.ai in action?</h2>
          <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
            Connect your QuickBooks account and see your first AI-generated financial insight in under a minute.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/connect"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-teal-400 hover:to-emerald-400 transition-all shadow-xl shadow-teal-500/25 hover:shadow-teal-500/40"
            >
              Start free trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-slate-700 text-slate-300 font-semibold rounded-xl hover:bg-slate-800 hover:border-slate-600 transition-all"
            >
              <Zap className="w-5 h-5 text-teal-400" />
              See pricing
            </Link>
          </div>

          <p className="mt-8 text-sm text-slate-500">
            PrimeCFO.ai — Unlocking Potential Through Financial Intelligence
            <sup className="text-[0.55em] align-super">™</sup>
          </p>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
