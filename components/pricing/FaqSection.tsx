'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Mail } from 'lucide-react';
import { pricingFaqs } from '@/data/pricing';

export default function FaqSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(0); // First open by default

  return (
    <section className="bg-slate-900/50 border-t border-slate-800/80 py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800 text-teal-400 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-400">
            Everything you need to know about our billing, plans, and advisory services.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {pricingFaqs.map((faq, index) => {
            const isOpen = openFaq === index;

            return (
              <div
                key={index}
                className="rounded-xl border border-slate-800 bg-slate-950/70 overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full py-4 px-5 text-left flex items-center justify-between gap-4 hover:bg-slate-900/80 transition-colors"
                >
                  <span className="font-medium text-sm sm:text-base text-slate-200">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-teal-400 flex-shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-teal-300' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/50 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Custom Support Banner */}
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-slate-900 border border-teal-500/20 text-center">
          <h3 className="text-base font-semibold text-white mb-1.5">
            Need custom reporting, cleanup, or full bookkeeping?
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto mb-4">
            Our CPA team at Prime Accounting Solutions can customize an engagement tailored to your specific books.
          </p>
          <a
            href="mailto:andrew@primeaccsolutions.com?subject=Custom%20PrimeCFO%20Engagement"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-400 hover:text-teal-300 font-medium text-xs sm:text-sm rounded-xl transition-colors border border-slate-700"
          >
            <Mail className="w-4 h-4" />
            Contact andrew@primeaccsolutions.com &rarr;
          </a>
        </div>

      </div>
    </section>
  );
}
