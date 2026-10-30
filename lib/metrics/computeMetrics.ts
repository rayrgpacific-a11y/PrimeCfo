/**
 * THE ONLY MODULE WHERE RATIOS ARE CALCULATED.
 * Every surface (dashboard, analytics, insights, PDF, email) reads a persisted snapshot built here.
 */
import type { SummaryMetrics } from '@/lib/metrics/loadClientMetrics';
import type { TrendPoint } from '@/lib/metrics/runway';
import type { AgingBuckets } from '@/lib/reporting/parseArAging';
import { computeRunway } from '@/lib/metrics/runway';
import { median } from '@/lib/dataQuality/utils';
import type { ReportRange } from '@/lib/qbo/reports';

export type RunwayMetric =
  | { kind: 'positive'; netCashFlowMonthly: number }
  | { kind: 'months'; value: number; netCashFlowMonthly: number }
  | { kind: 'unknown' };

export type MetricsSnapshotPayload = {
  range: ReportRange;
  summary: {
    revenue: number;
    expenses: number;
    netIncome: number;
    cash: number;
    cogs: number;
    grossProfit: number;
    profitMarginPct: number;
    accountsReceivable: number;
    accountsPayable: number;
    currentAssets: number;
    currentLiabilities: number;
    dataError: boolean;
  };
  aging: {
    ar: AgingBuckets;
    ap: AgingBuckets;
    asOfDate: string | null;
  } | null;
  hasInvoicingActivity: boolean;
  /** True when invoicing exists but aging total is $0 while revenue is material. */
  arSyncGap: boolean;
  grossMargin: number | null;
  netMargin: number | null;
  currentRatio: number | null;
  quickRatio: number | null;
  dso: number | null;
  dpo: number | null;
  dsoNote: string | null;
  dpoNote: string | null;
  /** Net cash flow per month (median reconciled CF months when available). */
  netCashFlowMonthly: number | null;
  /** Gross monthly outflows (P&L costs) — label "Monthly outflows" only, never "burn" when CF positive. */
  monthlyOutflows: number | null;
  runway: RunwayMetric;
  runwayMonths: number | null;
  cashFlowPositive: boolean;
  trailingRevenue: number;
  daysInPeriod: number;
  trailingNetCashFlow: number | null;
  displayBasis: 'Cash' | 'Accrual';
  currentPeriodIncomplete: boolean;
  /** Synced periods in the active window (e.g. 2 of 3 requested months). */
  periodCount: number;
};

function periodDays(range: ReportRange): number {
  if (range === '3m') return 90;
  if (range === '6m') return 180;
  if (range === '4q') return 365;
  return 365;
}

function percentValue(numerator: number, denominator: number): number | null {
  if (!denominator || !Number.isFinite(denominator) || !Number.isFinite(numerator)) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function ratioValue(numerator: number, denominator: number): number | null {
  if (!denominator || !Number.isFinite(denominator) || !Number.isFinite(numerator)) return null;
  if (numerator < 0 || denominator < 0) return null;
  return Math.round((numerator / denominator) * 100) / 100;
}

function daysValue(numerator: number, denominator: number, days: number): number | null {
  if (!denominator || !Number.isFinite(denominator) || !Number.isFinite(numerator)) return null;
  if (numerator <= 0) return 0;
  return Math.round((numerator / denominator) * days);
}

export type ComputeMetricsInput = {
  summary: SummaryMetrics;
  trends: TrendPoint[];
  range: ReportRange;
  aging: { ar: AgingBuckets; ap: AgingBuckets; asOfDate?: string | null } | null;
  hasInvoicingActivity: boolean;
  displayBasis: 'Cash' | 'Accrual';
  trailingNetCashFlow: number | null;
  currentPeriodIncomplete?: boolean;
  /** Reconciled monthly net CF values for median burn. */
  reconciledCfMonths?: number[];
  /** Active window period count — divides CF totals when columns sparse. */
  windowPeriodCount?: number;
  /** Pre-resolved monthly net cash (preferred — set by snapshot builder). */
  monthlyNetCash?: import('@/lib/metrics/netCashFlow').MonthlyNetCashResult | null;
};

export function computeMetrics(input: ComputeMetricsInput): MetricsSnapshotPayload {
  const { summary, trends, range, aging, hasInvoicingActivity, displayBasis, trailingNetCashFlow } =
    input;

  const arTotal =
    hasInvoicingActivity && aging ? Math.max(0, aging.ar.total) : summary.accounts_receivable;
  const apTotal =
    hasInvoicingActivity && aging ? Math.max(0, aging.ap.total) : summary.accounts_payable;

  const revenue = summary.revenue;
  const grossProfit =
    summary.gross_profit !== 0 ? summary.gross_profit : revenue - Math.abs(summary.cogs);

  const grossMargin = percentValue(grossProfit, revenue);
  const netMargin = summary.data_error ? null : percentValue(summary.net_income, revenue);

  const currentAssetsForRatio =
    aging && hasInvoicingActivity
      ? summary.cash +
        arTotal +
        Math.max(0, summary.current_assets - summary.cash - summary.accounts_receivable)
      : summary.current_assets;

  const currentLiabForRatio =
    aging && hasInvoicingActivity
      ? apTotal + Math.max(0, summary.current_liabilities - summary.accounts_payable)
      : summary.current_liabilities;

  const quickAssets = summary.cash + arTotal;
  const currentRatio = ratioValue(currentAssetsForRatio, currentLiabForRatio);
  const quickRatio = ratioValue(quickAssets, currentLiabForRatio);

  const days = periodDays(range);
  const dso = daysValue(arTotal, revenue, days);
  const cogs = Math.abs(summary.cogs) || null;
  const dpo = cogs ? daysValue(apTotal, cogs, days) : null;

  const dsoNote =
    dso === 0 && arTotal === 0
      ? hasInvoicingActivity
        ? null
        : 'No outstanding receivables at period end'
      : aging && aging.ar.total > 0
        ? 'DSO from A/R aging (open invoices)'
        : null;

  const dpoNote =
    dpo === 0 && apTotal === 0
      ? 'No outstanding payables at period end'
      : aging && aging.ap.total > 0
        ? 'DPO from A/P aging (open bills)'
        : null;

  const last3 = trends
    .map((t) => t.expenses)
    .filter((e) => e > 0)
    .slice(-3);
  const monthlyOutflows =
    last3.length > 0 ? Math.round(last3.reduce((a, b) => a + b, 0) / last3.length) : null;

  const cashForRunway = summary.cash;

  const monthlyNet =
    input.monthlyNetCash ??
    (() => {
      const cfMonths = input.reconciledCfMonths?.filter((n) => Number.isFinite(n)) ?? [];
      if (cfMonths.length >= 1) {
        const net =
          cfMonths.length >= 2 ? median(cfMonths) : cfMonths[0]!;
        return {
          netCashFlowMonthly: Math.round(net * 100) / 100,
          cashFlowPositive: net >= 0,
          periodCount: input.windowPeriodCount ?? cfMonths.length,
          monthlyValues: cfMonths,
        };
      }
      if (trailingNetCashFlow != null) {
        return {
          netCashFlowMonthly: trailingNetCashFlow,
          cashFlowPositive: trailingNetCashFlow >= 0,
          periodCount: input.windowPeriodCount ?? 1,
          monthlyValues: [trailingNetCashFlow],
        };
      }
      return null;
    })();

  const netCashFlowMonthly = monthlyNet?.netCashFlowMonthly ?? null;
  const cashFlowPositive = monthlyNet?.cashFlowPositive ?? false;

  const runwayResult = computeRunway(trends, cashForRunway, netCashFlowMonthly);

  let runway: RunwayMetric;
  if (cashFlowPositive && netCashFlowMonthly != null && netCashFlowMonthly >= 0) {
    runway = { kind: 'positive', netCashFlowMonthly };
  } else if (
    !cashFlowPositive &&
    netCashFlowMonthly != null &&
    netCashFlowMonthly < 0 &&
    runwayResult.runwayMonths != null
  ) {
    runway = {
      kind: 'months',
      value: runwayResult.runwayMonths,
      netCashFlowMonthly,
    };
  } else {
    runway = { kind: 'unknown' };
  }

  const arSyncGap =
    hasInvoicingActivity &&
    (aging?.ar.total ?? 0) === 0 &&
    Math.abs(revenue) > 10_000;

  return {
    range,
    summary: {
      revenue,
      expenses: summary.total_costs,
      netIncome: summary.net_income,
      cash: summary.cash,
      cogs: summary.cogs,
      grossProfit,
      profitMarginPct: summary.profit_margin_pct,
      accountsReceivable: arTotal,
      accountsPayable: apTotal,
      currentAssets: currentAssetsForRatio,
      currentLiabilities: currentLiabForRatio,
      dataError: summary.data_error,
    },
    aging: aging
      ? { ar: aging.ar, ap: aging.ap, asOfDate: aging.asOfDate ?? null }
      : null,
    hasInvoicingActivity,
    arSyncGap,
    grossMargin,
    netMargin,
    currentRatio,
    quickRatio,
    dso,
    dpo,
    dsoNote,
    dpoNote,
    netCashFlowMonthly,
    monthlyOutflows,
    runway,
    runwayMonths: cashFlowPositive ? null : runwayResult.runwayMonths,
    cashFlowPositive,
    trailingRevenue: revenue,
    daysInPeriod: days,
    trailingNetCashFlow: netCashFlowMonthly,
    displayBasis,
    currentPeriodIncomplete: input.currentPeriodIncomplete ?? false,
    periodCount: monthlyNet?.periodCount ?? input.windowPeriodCount ?? trends.length,
  };
}
