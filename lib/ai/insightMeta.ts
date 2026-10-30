/**
 * Static insight metadata — category and report deep-link come from this registry,
 * never from the LLM. Prevents leverage cards labeled "Margins" linking to P&L.
 */
import type { ReportRange } from '@/lib/qbo/reports';

export type InsightReportKey = 'pnl' | 'balance_sheet' | 'cash_flow';

export type InsightMeta = {
  category: string;
  linkTo: InsightReportKey;
  linkLabel: string;
};

export const INSIGHT_META = {
  leverage: { category: 'Leverage', linkTo: 'balance_sheet', linkLabel: 'Balance Sheet' },
  debt_service: { category: 'Debt Service', linkTo: 'cash_flow', linkLabel: 'Cash Flow Statement' },
  liquidity: { category: 'Liquidity', linkTo: 'balance_sheet', linkLabel: 'Balance Sheet' },
  owner_draws: { category: 'Owner & Tax Draws', linkTo: 'cash_flow', linkLabel: 'Cash Flow Statement' },
  margins: { category: 'Margins', linkTo: 'pnl', linkLabel: 'P&L' },
  revenue: { category: 'Revenue', linkTo: 'pnl', linkLabel: 'P&L' },
  runway: { category: 'Cash Runway', linkTo: 'cash_flow', linkLabel: 'Cash Flow Statement' },
  growth_capacity: { category: 'Growth Capacity', linkTo: 'pnl', linkLabel: 'P&L' },
} as const satisfies Record<string, InsightMeta>;

export type InsightMetaKey = keyof typeof INSIGHT_META;

export function reportHref(linkTo: InsightReportKey, range: ReportRange): string {
  return `/reports?tab=reports&report=${linkTo}&range=${range}`;
}

/** Infer registry key from insight title/metric/category (deterministic first). */
export function resolveInsightMetaKey(
  insight: { title: string; category: string; metric?: string | null }
): InsightMetaKey | null {
  const hay = `${insight.title} ${insight.category} ${insight.metric ?? ''}`.toLowerCase();

  if (
    hay.includes('debt-to-ebitda') ||
    hay.includes('debt to ebitda') ||
    hay.includes('debt-to-assets') ||
    hay.includes('debt to assets') ||
    (hay.includes('leverage') && !hay.includes('operating leverage'))
  ) {
    return 'leverage';
  }
  if (hay.includes('debt service') || hay.includes('interest coverage')) return 'debt_service';
  if (hay.includes('liquidity') || hay.includes('current ratio') || hay.includes('quick ratio')) {
    return 'liquidity';
  }
  if (hay.includes('owner draw') || hay.includes('shareholder draw') || hay.includes('draws (ytd)')) {
    return 'owner_draws';
  }
  if (hay.includes('runway') || hay.includes('breakeven')) return 'runway';
  if (hay.includes('growth capacity') || hay.includes('incremental margin')) return 'growth_capacity';
  if (hay.includes('gross margin') || hay.includes('net margin') || hay.includes('profit margin')) {
    return 'margins';
  }
  if (hay.includes('revenue')) return 'revenue';
  return null;
}

export function applyInsightMeta(
  insight: {
    title: string;
    category: string;
    metric?: string | null;
    reportLink?: { href: string; label: string };
  },
  range: ReportRange
): { category: string; reportLink?: { href: string; label: string } } {
  const key = resolveInsightMetaKey(insight);
  if (!key) {
    return {
      category: insight.category,
      reportLink: insight.reportLink,
    };
  }
  const meta = INSIGHT_META[key];
  return {
    category: meta.category,
    reportLink: {
      href: reportHref(meta.linkTo, range),
      label: meta.linkLabel,
    },
  };
}
