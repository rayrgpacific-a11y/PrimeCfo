'use client';

import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PricingHero from '@/components/pricing/PricingHero';
import PricingCard from '@/components/pricing/PricingCard';
import DecisionGuideSection from '@/components/pricing/DecisionGuideSection';
import ComparisonTableSection from '@/components/pricing/ComparisonTableSection';
import PricingTrustBanner from '@/components/pricing/PricingTrustBanner';
import FaqSection from '@/components/pricing/FaqSection';
import PricingCtaSection from '@/components/pricing/PricingCtaSection';
import { pricingPlans } from '@/data/pricing';
import { BillingPeriod } from '@/types/pricing';

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('annually');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-200">
      <Navbar />

      <main className="flex-1">
        {/* Header Hero with billing switcher */}
        <PricingHero 
          billingPeriod={billingPeriod} 
          onToggleBilling={setBillingPeriod} 
        />

        {/* Partner Integrations & Yelp Reviews (Social Proof First) */}
        <PricingTrustBanner />

        {/* 4 Tier Pricing Cards Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 mb-20 relative z-10">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingPlans.map((plan) => (
              <PricingCard 
                key={plan.id} 
                plan={plan} 
                billingPeriod={billingPeriod} 
              />
            ))}
          </div>
        </div>

        {/* Decision Guide */}
        <DecisionGuideSection />

        {/* Full Feature Comparison Table */}
        <ComparisonTableSection />

        {/* FAQ Accordion */}
        <FaqSection />

        {/* Bottom Call to Action */}
        <PricingCtaSection />
      </main>

      <Footer />
    </div>
  );
}
