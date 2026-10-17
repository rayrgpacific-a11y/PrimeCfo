'use client';

import React from 'react';
import { Star } from 'lucide-react';
import { trustedPartners, yelpReviews } from '@/data/testimonials';

export default function PricingTrustBanner() {
  return (
    <section className="bg-slate-950 border-t border-slate-900 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-[11px] sm:text-xs text-slate-500 uppercase tracking-[0.22em] font-semibold mb-8">
          Trusted Integrations &amp; Standards
        </p>

        {/* Partners */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 items-center justify-items-center text-slate-400 mb-12">
          {trustedPartners.map((partner) => (
            <div key={partner.name} className="flex flex-col items-center gap-1.5 hover:text-white transition-colors">
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: partner.color }} />
                {partner.name}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-600">
                {partner.tagline}
              </span>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-slate-500 mb-14">
          Built by <span className="text-slate-300 font-medium">Prime Accounting Solutions</span> · Helping small businesses unlock potential through financial intelligence since 2008.
        </p>

        {/* Yelp Reviews */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {yelpReviews.map((review) => (
            <div key={review.id} className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-1 mb-3 text-amber-400">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-[13.5px] leading-relaxed text-slate-300 mb-4">
                &ldquo;{review.quote}&rdquo;
              </p>
              <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800">
                <span>
                  <strong className="text-slate-200">{review.author}</strong> · {review.location}
                </span>
                <span className="text-[10px] uppercase text-slate-500 font-semibold">{review.source}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
