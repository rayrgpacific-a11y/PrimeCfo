/**
 * Runtime + CI invariant checks for metrics and insights.
 * A missing card is fine; a wrong number is not — suppress on failure.
 */
import type { AIInsight } from '@/lib/financialData';
import type { FinancialContext } from '@/lib/ai/getFinancialContext';
import type { MetricsSnapshotPayload } from '@/lib/metrics/computeMetrics';
import type { TrendPoint } from '@/lib/metrics/runway';

export type InvariantViolation = { code: string; detail: string };

const DOLLAR_TOLERANCE = 1.0;
const RATIO_TOLERANCE = 0.01;

function parseMoneyFigures(text: string): number[] {
  const out: number[] = [];
  const re = /\$[\s]?([\d,]+(?:\.\d+)?)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) != null) {
    const n = parseFloat(m[1]!.replace(/,/g, ''));
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

function knownReportDollars(context: FinancialContext): number[] {
  const s = context.summary;
  const bs = context.balanceSheet?.balanceSheet;
  const d = context.derived;
  const vals = [
    s.revenue,
    s.expenses,
    s.net_income,
    s.cash,
    s.accounts_receivable,
    s.accounts_payable,
    d.ownerCompensation,
    d.taxExpense,
    d.trailingNetCashFlow,
    d.openArTotal,
    context.metricsSnapshot?.summary.accountsReceivable,
    context.metricsSnapshot?.summary.accountsPayable,
    bs?.totalAssets,
    bs?.totalLiabilities,
    bs?.totalEquity,
    bs?.totalDebt,
    bs?.longTermDebt,
    bs?.lineOfCredit,
    bs?.creditCardBalances,
    bs?.shareholderDraws,
    context.balanceSheet?.periodEbitda,
    context.balanceSheet?.annualizedEbitda,
    context.balanceSheet?.interestExpenseTotal,
    context.balanceSheet?.ownerDraws?.totalYtd,
  ];
  return vals.filter((v): v is number => v != null && Number.isFinite(v)).map((v) => Math.abs(v));
}

function tiesToReportLine(figure: number, known: number[], tol = DOLLAR_TOLERANCE): boolean {
  if (figure < 100) return true; // small figures / percents — skip
  return known.some((k) => Math.abs(k - figure) <= tol || Math.abs(k - figure) / Math.max(k, 1) < 0.005);
}

export function checkRatioInvariants(
  kpis: Pick<{ quickRatio: number | null; currentRatio: number | null }, 'quickRatio' | 'currentRatio'>
): InvariantViolation[] {
  const violations: InvariantViolation[] = [];
  if (
    kpis.quickRatio != null &&
    kpis.currentRatio != null &&
    kpis.quickRatio > kpis.currentRatio + RATIO_TOLERANCE
  ) {
    violations.push({
      code: 'quick_gt_current',
      detail: `quickRatio ${kpis.quickRatio} > currentRatio ${kpis.currentRatio}`,
    });
  }
  return violations;
}

export function checkEbitdaInvariant(
  ebitda: number | null,
  pnlAvailable: boolean
): InvariantViolation[] {
  if (!pnlAvailable && ebitda != null) {
    return [{ code: 'ebitda_without_pnl', detail: 'EBITDA present but P&L missing' }];
  }
  return [];
}

export function checkContradictoryRevenueInsights(insights: AIInsight[]): InvariantViolation[] {
  const fired = (needle: string) =>
    insights.some((i) => {
      const hay = `${i.title} ${i.category} ${i.metric ?? ''}`.toLowerCase();
      return hay.includes(needle);
    });

  const up =
    insights.some((i) => {
      const hay = `${i.title} ${i.metric ?? ''}`.toLowerCase();
      return (
        (hay.includes('revenue growth') || hay.includes('revenue increase')) &&
        i.urgency === 'positive'
      );
    }) || fired('revenue_up');
  const down =
    insights.some((i) => {
      const hay = `${i.title} ${i.metric ?? ''} ${i.description}`.toLowerCase();
      return (
        hay.includes('revenue decline') ||
        hay.includes('revenue decrease') ||
        (hay.includes('revenue') && hay.includes('drop') && i.urgency !== 'positive')
      );
    }) || fired('revenue_down');

  if (up && down) {
    return [{ code: 'contradictory_revenue', detail: 'Both revenue_up and revenue_down fired' }];
  }
  return [];
}

export function checkDatesNotFuture(
  trends: TrendPoint[],
  today = new Date()
): InvariantViolation[] {
  const todayStr = today.toISOString().slice(0, 10);
  const violations: InvariantViolation[] = [];
  for (const t of trends) {
    if (t.end_date && t.end_date > todayStr) {
      violations.push({
        code: 'future_date',
        detail: `trend end_date ${t.end_date} > today ${todayStr}`,
      });
    }
  }
  return violations;
}

export function checkMonthColumnsSum(
  months: number[],
  total: number,
  tol = DOLLAR_TOLERANCE
): InvariantViolation[] {
  if (months.length === 0) return [];
  const sum = months.reduce((a, b) => a + b, 0);
  if (Math.abs(sum - total) > tol) {
    return [
      {
        code: 'month_sum_mismatch',
        detail: `months sum ${sum} != total ${total}`,
      },
    ];
  }
  return [];
}

function parseRatioFigures(text: string): number[] {
  const out: number[] = [];
  const re = /(\d+\.\d{1,2})x|\bratio[^0-9]*(\d+\.\d{1,2})\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) != null) {
    const n = parseFloat(m[1] ?? m[2] ?? '');
    if (Number.isFinite(n) && n > 0 && n < 20) out.push(n);
  }
  return out;
}

function ratioMatchesSnapshot(value: number, snapshot: MetricsSnapshotPayload, tol = RATIO_TOLERANCE): boolean {
  const candidates = [snapshot.quickRatio, snapshot.currentRatio].filter(
    (v): v is number => v != null && Number.isFinite(v)
  );
  return candidates.some((k) => Math.abs(k - value) <= tol);
}

export function checkInsightRatioFigures(
  insight: AIInsight,
  snapshot: MetricsSnapshotPayload
): InvariantViolation[] {
  const figures = parseRatioFigures(`${insight.description} ${insight.metricValue ?? ''}`);
  for (const f of figures) {
    if (!ratioMatchesSnapshot(f, snapshot)) {
      return [
        {
          code: 'untied_ratio',
          detail: `ratio ${f} in "${insight.title}" does not match snapshot`,
        },
      ];
    }
  }
  return [];
}

export function checkCashFlowPositiveVsRunway(
  insights: AIInsight[],
  cashFlowPositive: boolean
): InvariantViolation[] {
  if (!cashFlowPositive) return [];
  const hasPositive = insights.some((i) => {
    const hay = `${i.title} ${i.description}`.toLowerCase();
    return hay.includes('cash-flow positive') || hay.includes('cash flow positive');
  });
  const hasRunwayCountdown = insights.some((i) => {
    const hay = `${i.title} ${i.description} ${i.metric ?? ''}`.toLowerCase();
    return (
      (hay.includes('runway') || hay.includes('months left') || hay.includes('net burn')) &&
      i.urgency !== 'positive'
    );
  });
  if (hasPositive && hasRunwayCountdown) {
    return [{ code: 'cf_positive_vs_runway', detail: 'Cash-flow positive and runway countdown both shown' }];
  }
  return [];
}

export function checkRunwayTextWhenPositive(
  insights: AIInsight[],
  snapshot: MetricsSnapshotPayload
): InvariantViolation[] {
  if (snapshot.runway.kind !== 'positive') return [];
  for (const i of insights) {
    const hay = `${i.description} ${i.title}`.toLowerCase();
    if (hay.includes('months of runway') || hay.includes('months left')) {
      return [{ code: 'runway_text_when_positive', detail: `runway countdown text in "${i.title}"` }];
    }
  }
  return [];
}

export function checkRunwayOnlyWhenBurning(
  insights: AIInsight[],
  netCashFlow: number | null
): InvariantViolation[] {
  if (netCashFlow == null || netCashFlow < 0) return [];
  const runway = insights.find((i) => {
    const hay = `${i.title} ${i.category} ${i.metric ?? ''}`.toLowerCase();
    return hay.includes('runway') && (i.urgency === 'warning' || i.urgency === 'critical');
  });
  if (runway) {
    return [
      {
        code: 'runway_without_burn',
        detail: `runway countdown with non-negative net cash ${netCashFlow}`,
      },
    ];
  }
  return [];
}

export function checkInsightDollarFigures(
  insight: AIInsight,
  context: FinancialContext
): InvariantViolation[] {
  const known = knownReportDollars(context);
  if (known.length === 0) return [];
  const figures = parseMoneyFigures(`${insight.description} ${insight.metricValue ?? ''}`);
  for (const f of figures) {
    if (!tiesToReportLine(f, known)) {
      return [
        {
          code: 'untied_dollar',
          detail: `$${f} in "${insight.title}" does not tie to report lines`,
        },
      ];
    }
  }
  return [];
}

export function checkMinInsightCount(
  insights: AIInsight[],
  hasData: boolean,
  min = 1
): InvariantViolation[] {
  if (!hasData) return [];
  if (insights.length < min) {
    return [{ code: 'too_few_insights', detail: `insightCount ${insights.length} < ${min}` }];
  }
  return [];
}

/**
 * Suppress any insight that fails dollar-tie or contradiction checks.
 * Prefer a missing card over a wrong number.
 */
export function suppressInvalidInsights(
  insights: AIInsight[],
  context: FinancialContext
): AIInsight[] {
  const contradictions = checkContradictoryRevenueInsights(insights);
  let working = insights;
  if (contradictions.length > 0) {
    // Drop decline cards when growth also fired (or vice versa) — keep positive growth if present.
    const hasGrowth = working.some((i) => i.title.toLowerCase().includes('revenue growth'));
    working = working.filter((i) => {
      const hay = `${i.title} ${i.description}`.toLowerCase();
      if (hasGrowth && (hay.includes('revenue decline') || hay.includes('revenue decrease'))) {
        return false;
      }
      return true;
    });
  }

  const cashFlowPositive =
    context.metricsSnapshot?.cashFlowPositive ??
    (context.derived.trailingNetCashFlow ?? 0) >= 0;

  if (cashFlowPositive) {
    working = working.filter((i) => {
      const hay = `${i.title} ${i.category} ${i.metric ?? ''} ${i.description}`.toLowerCase();
      if (hay.includes('monthly burn') || hay.includes('net burn')) return false;
      if (!hay.includes('runway')) return true;
      return i.urgency === 'positive' || i.urgency === 'info';
    });
  }

  const cfViolations = checkCashFlowPositiveVsRunway(working, cashFlowPositive);
  if (cfViolations.length > 0) {
    working = working.filter((i) => {
      const hay = `${i.title} ${i.description}`.toLowerCase();
      return !(hay.includes('runway') && (i.urgency === 'warning' || i.urgency === 'critical'));
    });
  }

  if (context.metricsSnapshot) {
    working = working.filter(
      (insight) =>
        checkInsightRatioFigures(insight, context.metricsSnapshot!).length === 0 &&
        checkInsightDollarFigures(insight, context).length === 0
    );
    const runwayText = checkRunwayTextWhenPositive(working, context.metricsSnapshot);
    if (runwayText.length > 0) {
      working = working.filter((i) => {
        const hay = `${i.description} ${i.title}`.toLowerCase();
        return !hay.includes('months of runway') && !hay.includes('months left');
      });
    }
  } else {
    working = working.filter((insight) => checkInsightDollarFigures(insight, context).length === 0);
  }

  return working;
}
