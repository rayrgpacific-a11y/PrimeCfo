'use client';

import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import WorkflowSection from '@/components/landing/WorkflowSection';
import SocialProofSection from '@/components/landing/SocialProofSection';
import LandingPricingSection from '@/components/landing/LandingPricingSection';
import SecurityBannerSection from '@/components/landing/SecurityBannerSection';
import LandingCtaSection from '@/components/landing/LandingCtaSection';
import ContactSection from '@/components/landing/ContactSection';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-teal-500 selection:text-white font-sans">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <WorkflowSection />
      <SocialProofSection />
      <LandingPricingSection />  
      <SecurityBannerSection />
      <LandingCtaSection />
      <ContactSection />
      <Footer />
    </div>
  );
}
