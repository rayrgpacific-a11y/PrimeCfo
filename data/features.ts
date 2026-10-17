export interface LandingFeature {
  title: string;
  description: string;
  iconName: 'Link2' | 'BarChart3' | 'Brain' | 'FileText' | 'TrendingUp' | 'Shield' | 'RefreshCw' | 'Users';
  gradient: string;
  shadowColor: string;
}

export interface WorkflowStep {
  step: string;
  title: string;
  description: string;
}

export const landingFeatures: LandingFeature[] = [
  {
    title: 'QuickBooks Integration',
    description: 'One-click secure OAuth connection directly to your QuickBooks Online account.',
    iconName: 'Link2',
    gradient: 'from-teal-500 to-emerald-500',
    shadowColor: 'hover:shadow-teal-500/5'
  },
  {
    title: 'Financial Dashboard',
    description: 'Real-time metrics, cash burn rate, runway estimation, and multi-period comparisons.',
    iconName: 'BarChart3',
    gradient: 'from-blue-500 to-cyan-500',
    shadowColor: 'hover:shadow-blue-500/5'
  },
  {
    title: 'AI-Powered Insights',
    description: 'Plain-English executive analysis of your balance sheet, P&L, and expense leaks.',
    iconName: 'Brain',
    gradient: 'from-violet-500 to-purple-500',
    shadowColor: 'hover:shadow-purple-500/5'
  },
  {
    title: 'Automated Reports',
    description: 'Instant P&L, Balance Sheet, and Cash Flow digests automatically scheduled.',
    iconName: 'FileText',
    gradient: 'from-amber-500 to-orange-500',
    shadowColor: 'hover:shadow-amber-500/5'
  },
  {
    title: 'Trend Analysis',
    description: 'Month-over-month and year-over-year performance curves with anomaly detection.',
    iconName: 'TrendingUp',
    gradient: 'from-pink-500 to-rose-500',
    shadowColor: 'hover:shadow-rose-500/5'
  },
  {
    title: 'Encrypted & Isolated',
    description: '256-bit SSL in transit, encrypted token vaults, and tenant data isolation.',
    iconName: 'Shield',
    gradient: 'from-slate-600 to-slate-700',
    shadowColor: 'hover:shadow-slate-500/5'
  },
  {
    title: 'Auto-Sync',
    description: 'Continuous background data synchronization keeps all numbers accurate in real time.',
    iconName: 'RefreshCw',
    gradient: 'from-green-500 to-emerald-500',
    shadowColor: 'hover:shadow-emerald-500/5'
  },
  {
    title: 'Multi-Client Support',
    description: 'Manage multiple businesses, entities, or client accounts from one central console.',
    iconName: 'Users',
    gradient: 'from-indigo-500 to-blue-500',
    shadowColor: 'hover:shadow-indigo-500/5'
  }
];

export const workflowSteps: WorkflowStep[] = [
  {
    step: '01',
    title: 'Connect QuickBooks',
    description: 'Securely authorize your QuickBooks Online company account with one click.'
  },
  {
    step: '02',
    title: 'We Pull Your Data',
    description: 'PrimeCFO.ai retrieves your P&L, Balance Sheet, Invoices, and Cash Flow securely.'
  },
  {
    step: '03',
    title: 'AI Analyzes Everything',
    description: 'Our models calculate margins, runway, anomalies, and working capital trends.'
  },
  {
    step: '04',
    title: 'You Make Better Decisions',
    description: 'View your actionable executive dashboard — no expensive CFO fees or accounting degree needed.'
  }
];
