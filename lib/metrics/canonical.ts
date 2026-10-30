/**
 * Canonical ratio math — single source for Analytics UI and insight generators.
 * Insights must consume these values; they must not recompute margins/ratios.
 */
import type { SummaryMetrics } from '@/lib/metrics/loadClientMetrics';
import type { TrendPoint } from '@/lib/metrics/runway';
import { computeAnalyticsKpis, type AnalyticsKpis } from '@/lib/metrics/ratios';
import { periodMonthsForRange } from '@/lib/metrics/periodMonths';
import type { ReportRange } from '@/lib/qbo/reports';

export type CanonicalMetrics = AnalyticsKpis & {
  /** Gross profit used for the margin (matches Analytics). */
  grossProfit: number | null;
  /** Net income used for the margin. */
  netIncome: number | null;
  /** Revenue denominator used for margins. */
  revenue: number | null;
  periodMonths: number;
  /** True when the window is a full trailing-twelve-months. */
  isTtm: boolean;
  /** Label for annualized figures: "TTM" for 12m, else "annualized". */
  annualizationLabel: 'TTM' | 'annualized';
};

/**
 * Resolve gross profit the same way Analytics does:
 * prefer stored gross_profit; fall back to revenue − |cogs|.
 */
export function resolveGrossProfit(summary: SummaryMetrics): number {
  if (summary.gross_profit !== 0) return summary.gross_profit;
  return summary.revenue - Math.abs(summary.cogs);
}

/**
 * Canonical metrics from the same summary payload the P&L / Analytics UI renders.
 */
export function computeCanonicalMetrics(
  summary: SummaryMetrics | null,
  trends: TrendPoint[],
  runwayMonths: number | null,
  range: ReportRange = '12m',
  opts?: {
    openArFromAging?: number | null;
    openApFromAging?: number | null;
  }
): CanonicalMetrics {
  const kpis = computeAnalyticsKpis(summary, trends, runwayMonths, range, opts);
  const periodMonths = periodMonthsForRange(range);
  const isTtm = range === '12m' || periodMonths === 12;

  return {
    ...kpis,
    grossProfit: summary ? resolveGrossProfit(summary) : null,
    netIncome: summary && !summary.data_error ? summary.net_income : null,
    revenue: summary?.revenue ?? null,
    periodMonths,
    isTtm,
    annualizationLabel: isTtm ? 'TTM' : 'annualized',
  };
}

/** Format Debt-to-EBITDA / similar labels with TTM vs annualized. */
export function leverageMetricLabel(
  base: string,
  annualizationLabel: 'TTM' | 'annualized'
): string {
  if (annualizationLabel === 'TTM') return `${base} (TTM)`;
  return `${base} (annualized)`;
}
