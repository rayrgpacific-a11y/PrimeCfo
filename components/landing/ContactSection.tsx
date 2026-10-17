'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, MapPin, Zap } from 'lucide-react';

export default function ContactSection() {
  return (
    <section id="contact" className="bg-slate-950 py-24 border-t border-slate-900 scroll-mt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center mb-14">
          <p className="text-teal-400 text-sm font-semibold uppercase tracking-wider mb-3">Contact Us</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Have Questions? We&apos;re Here to Help
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Whether you need customized onboarding, enterprise multi-entity setups, or fractional CFO guidance.
          </p>
        </div>

        {/* 3 Contact Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Email Support */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center flex flex-col items-center hover:border-slate-700 transition-colors shadow-lg">
            <div className="w-12 h-12 bg-teal-500/10 border border-teal-500/20 rounded-xl flex items-center justify-center mb-4 text-teal-400">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">Email Support</h3>
            <p className="text-xs text-slate-400 mb-4">Direct contact for questions and onboarding</p>
            <a
              href="mailto:support@primecfo.ai"
              className="text-sm font-medium text-teal-400 hover:text-teal-300 transition-colors"
            >
              support@primecfo.ai
            </a>
          </div>

          {/* Headquarters */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center flex flex-col items-center hover:border-slate-700 transition-colors shadow-lg">
            <div className="w-12 h-12 bg-teal-500/10 border border-teal-500/20 rounded-xl flex items-center justify-center mb-4 text-teal-400">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">Headquarters</h3>
            <p className="text-xs text-slate-400 mb-4">Prime Accounting Solutions, LLC</p>
            <p className="text-sm text-slate-300">
              Los Angeles, California
            </p>
          </div>

          {/* Fast Onboarding */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center flex flex-col items-center justify-between hover:border-slate-700 transition-colors shadow-lg">
            <div>
              <div className="w-12 h-12 bg-teal-500/10 border border-teal-500/20 rounded-xl flex items-center justify-center mb-4 text-teal-400 mx-auto">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">Fast Onboarding</h3>
              <p className="text-xs text-slate-400 mb-4">Connect your books in less than 2 minutes</p>
            </div>
            <Link
              href="/connect"
              className="w-full py-2.5 px-4 text-center text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 rounded-xl transition-all shadow-md shadow-teal-500/20"
            >
              Connect Now
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
}
