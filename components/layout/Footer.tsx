'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Lock } from 'lucide-react';
import { footerLinkGroups } from '@/data/navigation';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          
          {/* Brand Info */}
          <div className="col-span-2">
            <Link href="/" className="inline-flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-md shadow-teal-500/20">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Prime<span className="text-teal-400">CFO</span>
                <span className="text-slate-400 text-sm">.ai</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed mb-6 max-w-xs">
              AI-powered financial intelligence that transforms your QuickBooks data into clear, actionable business insights.
            </p>
            <div className="flex items-center gap-4 text-slate-500 text-xs">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-teal-400" /> Security First
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-teal-400" /> 256-bit SSL
              </span>
            </div>
          </div>

          {/* Categorized Link Groups */}
          {footerLinkGroups.map((group) => (
            <div key={group.title}>
              <h4 className="text-sm font-semibold text-white mb-4">{group.title}</h4>
              <ul className="space-y-2.5 text-sm text-slate-400">
                {group.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('#') ? (
                      <a href={link.href} className="hover:text-teal-400 transition-colors">
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className="hover:text-teal-400 transition-colors">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>
      </div>

      {/* Sub-footer copyright & legal */}
      <div className="border-t border-slate-800/60 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/eula" className="hover:text-teal-400 transition-colors">
              Terms of Service
            </Link>
            <span>|</span>
            <Link href="/privacy" className="hover:text-teal-400 transition-colors">
              Privacy Policy
            </Link>
          </div>
          <p>© 2026 PrimeCFO AI Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
