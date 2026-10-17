import { PricingTier, ComparisonRow, FaqItem, DecisionGuideTier } from '@/types/pricing';

export const pricingPlans: PricingTier[] = [
  {
    id: 'starter',
    name: 'STARTER',
    tagline: 'Your numbers, always visible.',
    monthlyPrice: 59,
    annualPrice: 53,
    annualSavings: 72,
    features: [
      'Cash position, revenue trend, profit margin, AR aging, cash runway',
      'Monthly AI summary in plain English — emailed to you',
      'Current cash position & runway — updated daily',
      'QuickBooks Online 1-click sync',
      'Secure 256-bit encryption'
    ],
    ctaText: 'Start Free for 14 Days'
  },
  {
    id: 'see',
    name: 'SEE',
    tagline: 'Your numbers, finally clear.',
    monthlyPrice: 119,
    annualPrice: 107,
    annualSavings: 144,
    features: [
      'Everything in Starter',
      '30-day cash flow forecast',
      'Data-quality alerts when your books need attention',
      'Monthly AI summary in plain English — emailed to you',
      'Automated P&L and Balance Sheet tracking'
    ],
    ctaText: 'Start Free for 14 Days'
  },
  {
    id: 'understand',
    name: 'UNDERSTAND',
    tagline: 'AI insights. Human guidance.',
    monthlyPrice: 349,
    annualPrice: 314,
    annualSavings: 420,
    popular: true,
    features: [
      'Everything in See',
      'Weekly AI financial summaries',
      '60-day cash flow forecast',
      '1-hour quarterly advisory meeting with your fractional CFO',
      'Working capital & AP/AR aging analysis'
    ],
    ctaText: 'Start Free for 14 Days'
  },
  {
    id: 'act',
    name: 'ACT',
    tagline: 'A finance team in your corner.',
    monthlyPrice: 699,
    annualPrice: 629,
    annualSavings: 840,
    features: [
      'Everything in Understand',
      '90-day forecast with scenarios',
      'Custom alerts when numbers shift',
      '1-hour monthly advisory meeting with your fractional CFO',
      'Multi-entity & dedicated strategic review'
    ],
    ctaText: 'Start Free for 14 Days',
    secondaryCta: {
      text: 'Book a Conversation',
      href: 'mailto:andrew@primeaccsolutions.com?subject=PrimeCFO%20Act%20Tier%20Inquiry'
    }
  }
];

export const pricingFaqs: FaqItem[] = [
  {
    question: 'Is a credit card required for the free trial?',
    answer:
      "Yes. All plans require a card at signup. You won't be charged during the 14-day trial — billing starts automatically on day 15 unless you cancel before then."
  },
  {
    question: 'Can I switch tiers as my business grows?',
    answer:
      'Absolutely. Upgrading is seamless — your dashboard, data, and history carry over automatically. You only gain features, never lose them.'
  },
  {
    question: 'Do you offer full-service bookkeeping or tax prep?',
    answer:
      "Bookkeeping and tax services are available as a separate engagement with Prime Accounting Solutions. Email us at andrew@primeaccsolutions.com and we'll put together a quote that fits your business."
  },
  {
    question: 'How does the AI generate financial summaries?',
    answer:
      'PrimeCFO.ai connects directly to your QuickBooks data, analyzes trends, anomalies, and key metrics, then generates plain-English summaries tailored to your business — like having a CFO review your numbers.'
  },
  {
    question: 'Is my financial data secure?',
    answer:
      'We encrypt data in transit (256-bit SSL/TLS) and at rest, isolate each tenant’s data, and connect to QuickBooks via OAuth — we never store your QuickBooks password. Your data is strictly private and never shared or sold.'
  }
];

export const comparisonRows: ComparisonRow[] = [
  { feature: 'QuickBooks Online Real-Time Sync', starter: true, see: true, understand: true, act: true },
  { feature: 'Core Financial Metrics (Revenue, Profit, Cash, Runway)', starter: true, see: true, understand: true, act: true },
  { feature: 'Daily Cash Position & Runway Updates', starter: true, see: true, understand: true, act: true },
  { feature: 'AI Financial Summaries Emailed', starter: 'Monthly', see: 'Monthly', understand: 'Weekly', act: 'Weekly' },
  { feature: 'Cash Flow Forecasting', starter: false, see: '30-Day', understand: '60-Day', act: '90-Day + Scenarios' },
  { feature: 'Data-Quality Alerts When Books Need Attention', starter: false, see: true, understand: true, act: true },
  { feature: 'Custom Alert Triggers When Numbers Shift', starter: false, see: false, understand: false, act: true },
  { feature: 'Fractional CFO Strategic Advisory Meetings', starter: false, see: false, understand: '1 hr / Quarter', act: '1 hr / Month' },
  { feature: 'Multi-Entity & Custom Scenarios', starter: false, see: false, understand: false, act: true }
];

export const decisionGuideTiers: DecisionGuideTier[] = [
  {
    title: 'Starter',
    subtitle: 'I want essentials',
    targetUser: 'Small teams needing core visibility',
    description: 'Gives a clear dashboard, monthly AI summary emailed to you, and daily cash position & runway — no forward forecast.'
  },
  {
    title: 'See',
    subtitle: 'I want to do it myself',
    targetUser: 'Hands-on owners managing cash flow',
    description: 'Adds a 30-day cash flow forecast and automated data-quality alerts on top of Starter.'
  },
  {
    title: 'Understand',
    subtitle: 'I want a guide',
    targetUser: 'Growing companies ready for quarterly CFO advice',
    badge: 'Most Popular',
    description: 'Adds weekly AI summaries, a 60-day forecast, and a 1-hour quarterly advisory meeting with your fractional CFO.'
  },
  {
    title: 'Act',
    subtitle: 'I want a partner',
    targetUser: 'Established businesses wanting full advisory support',
    description: 'Layers in scenario planning, custom alerts, and a 1-hour monthly advisory meeting with your dedicated fractional CFO.'
  }
];
