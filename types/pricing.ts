export type BillingPeriod = 'monthly' | 'annually';

export interface PricingTier {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  annualSavings: number;
  popular?: boolean;
  features: string[];
  ctaText: string;
  secondaryCta?: {
    text: string;
    href: string;
  };
}

export interface ComparisonRow {
  feature: string;
  starter: boolean | string;
  see: boolean | string;
  understand: boolean | string;
  act: boolean | string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface DecisionGuideTier {
  title: string;
  subtitle: string;
  targetUser: string;
  badge?: string;
  description: string;
}
