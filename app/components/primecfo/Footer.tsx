"use client";

import React from "react";
import Link from "next/link";
import { BarChart3, Shield, Lock } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-teal-500/10 border border-teal-500/30 rounded-lg flex items-center justify-center text-teal-400">
                <BarChart3 className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Prime<span className="text-teal-400">CFO</span>
                <span className="text-slate-400 text-xs">.ai</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed mb-6 max-w-xs text-xs">
              AI-powered financial intelligence that transforms QuickBooks ledger data into clear, actionable executive insights.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/security"
                className="flex items-center gap-1.5 text-slate-400 hover:text-teal-300 transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-teal-400" />
                <span>SOC2-Ready Architecture</span>
              </Link>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Lock className="w-3.5 h-3.5 text-teal-400" />
                <span>AES-256 Encryption</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/#features" className="hover:text-teal-300 transition-colors">Features</Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-teal-300 transition-colors">Pricing Plans</Link>
              </li>
              <li>
                <Link href="/connect" className="hover:text-teal-300 transition-colors">Connect QuickBooks</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/about" className="hover:text-teal-300 transition-colors">About PrimeCFO</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-teal-300 transition-colors">Contact Support</Link>
              </li>
              <li>
                <a
                  href="https://primeaccsolutions.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-teal-300 transition-colors"
                >
                  Prime Accounting Solutions ↗
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Security & Legal</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/security" className="hover:text-teal-300 transition-colors">Security Whitepaper</Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-teal-300 transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-teal-300 transition-colors">Terms of Service</Link>
              </li>
              <li>
                <Link href="/eula" className="hover:text-teal-300 transition-colors">EULA Agreement</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Operations</h4>
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-slate-300 text-xs">All Systems Operational</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Encrypted API links to Intuit QuickBooks, Supabase, and Stripe.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-900 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-slate-500">
            &copy; {new Date().getFullYear()} PrimeCFO AI Inc. & Prime Accounting Solutions, LLC. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/privacy" className="hover:text-teal-300 transition-colors">Privacy</Link>
            <span className="text-slate-800">·</span>
            <Link href="/terms" className="hover:text-teal-300 transition-colors">Terms</Link>
            <span className="text-slate-800">·</span>
            <Link href="/security" className="hover:text-teal-300 transition-colors">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
