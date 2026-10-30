/**
 * Cost structure insights — service / product / hybrid classification from synced P&L.
 */
import type { AIInsight, InsightSeverity } from '@/lib/financialData';
import type { MetricsSnapshotPayload } from '@/lib/metrics/computeMetrics';
import type { TrendPoint } from '@/lib/metrics/runway';
import { SEVERITY_ORDER } from '@/lib/ai/generateInsights';

export type BusinessModel = 'service' | 'product' | 'hybrid';

const LABOR_COGS = /labor|wages|payroll|contractor|1099|billable|subcontract/i;

function fmtMoney(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

/** Classify from monthly trend COGS structure (proxy when line items unavailable). */
export function classifyBusinessFromTrends(
  trends: TrendPoint[],
  inventory: number = 0
): BusinessModel {
  if (trends.length === 0) return 'service';

  const withCogs = trends.filter((t) => (t.cogs ?? 0) > 0 || t.expenses > 0);
  const avgCogs = withCogs.length
    ? withCogs.reduce((s, t) => s + Math.abs(t.cogs ?? t.expenses * 0.4), 0) / withCogs.length
    : 0;
  const avgRev = trends.reduce((s, t) => s + t.revenue, 0) / Math.max(trends.length, 1);

  // Without line-level COGS in trends, treat high COGS/revenue + inventory as product/hybrid.
  const cogsRatio = avgRev > 0 ? avgCogs / avgRev : 0;
  if (inventory > 0 || cogsRatio > 0.35) {
    if (cogsRatio > 0.15 && inventory <= 0) return 'hybrid';
    return inventory > 0 ? 'product' : 'hybrid';
  }
  return 'service';
}

type MonthGp = { label: string; revenue: number; cogs: number; grossProfit: number };

function monthlyGrossProfit(trends: TrendPoint[]): MonthGp[] {
  return trends.map((t) => {
    const cogs = Math.abs(t.cogs ?? 0);
    const gp = t.revenue - cogs;
    return { label: t.periodLabel, revenue: t.revenue, cogs, grossProfit: gp };
  });
}

/**
 * Service-model insight: gross margin / labor capacity vs collections.
 * Fires on large GM swing or sustained negative GM with stable labor COGS.
 */
export function evaluateCostStructureInsight(
  snapshot: MetricsSnapshotPayload,
  trends: TrendPoint[]
): AIInsight | null {
  if (snapshot.currentPeriodIncomplete || snapshot.summary.dataError) return null;

  const months = monthlyGrossProfit(trends);
  if (months.length < 2) return null;

  const model = classifyBusinessFromTrends(trends);
  if (model === 'product') return null; // product rules deferred

  const recent = months.slice(-3);
  const best = recent.reduce(
    (b, m) => (m.grossProfit > b.grossProfit ? m : b),
    recent[0]!
  );
  const worst = recent.reduce(
    (w, m) => (m.grossProfit < w.grossProfit ? m : w),
    recent[0]!
  );

  const laborHeld =
    recent.length >= 2 &&
    recent.every((m) => Math.abs(m.cogs) > 0) &&
    Math.abs(recent[recent.length - 1]!.cogs - recent[0]!.cogs) /
      Math.max(Math.abs(recent[0]!.cogs), 1) <
      0.15;

  const gmSwing = best.grossProfit - worst.grossProfit;
  const gmDropPts =
    snapshot.grossMargin != null && best.revenue > 0
      ? ((best.grossProfit / best.revenue) - (worst.grossProfit / Math.max(worst.revenue, 1))) * 100
      : null;

  const firesNegativeGm = worst.grossProfit < 0 && best.grossProfit > 0 && gmSwing > 50_000;
  const firesLargeDrop = gmDropPts != null && gmDropPts > 10 && gmSwing > 30_000;

  if (!firesNegativeGm && !firesLargeDrop) {
    if (snapshot.grossMargin != null && snapshot.grossMargin < 0) {
      // Still fire on current negative GM
    } else {
      return null;
    }
  }

  let severity: InsightSeverity = 'watch';
  if (worst.grossProfit < 0 && snapshot.grossMargin != null && snapshot.grossMargin < 0) {
    severity = 'warning';
  } else if (best.grossProfit > 0 && worst.grossProfit >= 0) {
    severity = 'info';
  }

  const avgLabor = recent.reduce((s, m) => s + Math.abs(m.cogs), 0) / recent.length;
  const laborNote = laborHeld
    ? ` Cost of labor held near ${fmtMoney(avgLabor)}/mo while collections moved.`
    : '';

  const description =
    `Gross profit swung from ${fmtMoney(best.grossProfit)} in ${best.label} to ${fmtMoney(worst.grossProfit)} in ${worst.label}.${laborNote} ` +
    (worst.grossProfit < 0
      ? 'Labor capacity may be outrunning collected revenue — review utilization and contractor hours against the pipeline before adding capacity.'
      : 'Review whether the margin shift is seasonal or structural before changing capacity.');

  return {
    id: `cost-structure-${Date.now()}`,
    title: worst.grossProfit < 0 ? 'Gross Margin Under Pressure' : 'Gross Margin Shift',
    description,
    urgency: severity,
    category: 'Cost Structure',
    metric: 'Gross Profit Trend',
    metricValue: snapshot.grossMargin != null ? `${snapshot.grossMargin.toFixed(1)}%` : undefined,
    createdAt: new Date().toISOString(),
  };
}

export function costStructureSeverityOrder(): typeof SEVERITY_ORDER {
  return SEVERITY_ORDER;
}
