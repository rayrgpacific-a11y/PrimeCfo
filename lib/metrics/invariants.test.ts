/**
 * Round 6 invariant suite — CI assertions covering every class of bug from rounds 1–6.
 * Run via: npm test
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  checkContradictoryRevenueInsights,
  checkDatesNotFuture,
  checkEbitdaInvariant,
  checkMinInsightCount,
  checkMonthColumnsSum,
  checkRatioInvariants,
  checkRunwayOnlyWhenBurning,
  suppressInvalidInsights,
} from '@/lib/ai/insightInvariants';
import { computeCanonicalMetrics, resolveGrossProfit } from '@/lib/metrics/canonical';
import { priorPeriodIsSufficient, countMonthsWithData } from '@/lib/metrics/priorPeriod';
import { resolveInsightMetaKey, INSIGHT_META } from '@/lib/ai/insightMeta';
import { reportLinkForInsight } from '@/lib/ai/insightEnrichment';
import type { SummaryMetrics } from '@/lib/metrics/loadClientMetrics';
import type { AIInsight } from '@/lib/financialData';
import type { FinancialContext } from '@/lib/ai/getFinancialContext';

function insight(partial: Omit<AIInsight, 'createdAt'> & { createdAt?: string }): AIInsight {
  return { createdAt: '2026-07-01T00:00:00Z', ...partial };
}

const baseSummary = (overrides: Partial<SummaryMetrics> = {}): SummaryMetrics => ({
  revenue: 1_092_000,
  expenses: 400_000,
  total_costs: 580_000,
  net_income: 250_256,
  profit_margin_pct: 22.9,
  cash: 120_000,
  accounts_receivable: 80_000,
  accounts_payable: 40_000,
  cogs: 180_000,
  gross_profit: 507_744,
  current_assets: 250_000,
  current_liabilities: 100_000,
  inventory: 10_000,
  quick_assets: 200_000,
  data_error: false,
  ...overrides,
});

describe('Round 6 invariants', () => {
  it('quickRatio <= currentRatio + 0.01', () => {
    const kpis = computeCanonicalMetrics(baseSummary(), [], null, '12m');
    assert.equal(checkRatioInvariants(kpis).length, 0);
    assert.ok((kpis.quickRatio ?? 0) <= (kpis.currentRatio ?? 0) + 0.01);
  });

  it('ebitda !== null || pnl === null', () => {
    assert.equal(checkEbitdaInvariant(296_398, true).length, 0);
    assert.equal(checkEbitdaInvariant(null, false).length, 0);
    assert.ok(checkEbitdaInvariant(100, false).length > 0);
  });

  it('!(fired(revenue_up) && fired(revenue_down))', () => {
    const both: AIInsight[] = [
      insight({
        id: '1',
        title: 'Revenue Growth',
        category: 'Revenue',
        description: 'up',
        urgency: 'positive',
        metric: 'Revenue Growth',
        metricValue: '+10%',
      }),
      insight({
        id: '2',
        title: 'Revenue Decline',
        category: 'Revenue',
        description: 'down',
        urgency: 'warning',
        metric: 'Revenue',
        metricValue: '-10%',
      }),
    ];
    assert.ok(checkContradictoryRevenueInsights(both).length > 0);
  });

  it('everyDisplayedDate <= today', () => {
    const today = new Date('2026-07-10T12:00:00Z');
    const ok = checkDatesNotFuture(
      [
        {
          periodLabel: 'Jun 2026',
          start_date: '2026-06-01',
          end_date: '2026-06-30',
          revenue: 1,
          expenses: 1,
          profit: 0,
          cash: 0,
        },
      ],
      today
    );
    assert.equal(ok.length, 0);
    const bad = checkDatesNotFuture(
      [
        {
          periodLabel: 'Aug 2026',
          start_date: '2026-08-01',
          end_date: '2026-08-31',
          revenue: 1,
          expenses: 1,
          profit: 0,
          cash: 0,
        },
      ],
      today
    );
    assert.ok(bad.length > 0);
  });

  it('monthColumns.sum().equals(totalColumn, 1.00)', () => {
    assert.equal(checkMonthColumnsSum([100, 200, 300], 600).length, 0);
    assert.ok(checkMonthColumnsSum([100, 200, 300], 601.5).length > 0);
  });

  it('netCashFlow < 0 || !fired(runway_countdown)', () => {
    const runway: AIInsight[] = [
      insight({
        id: 'r',
        title: 'Cash Runway Critical',
        category: 'Cash Runway',
        description: 'burning',
        urgency: 'warning',
        metric: 'Cash Runway',
        metricValue: '2 mo',
      }),
    ];
    assert.ok(checkRunwayOnlyWhenBurning(runway, 5_000).length > 0);
    assert.equal(checkRunwayOnlyWhenBurning(runway, -5_000).length, 0);
  });

  it('insightCount >= MIN_FOR_ACCOUNT_WITH_DATA', () => {
    assert.equal(checkMinInsightCount([{ id: '1' } as AIInsight], true, 1).length, 0);
    assert.ok(checkMinInsightCount([], true, 1).length > 0);
  });

  it('canonical margins match Analytics math (no abs-revenue divergence)', () => {
    const summary = baseSummary({
      revenue: 1_092_000,
      cogs: 583_200,
      gross_profit: 0, // force fallback: revenue − |cogs|
      net_income: 237_000,
    });
    const canonical = computeCanonicalMetrics(summary, [], null, '12m');
    const gp = resolveGrossProfit(summary);
    assert.equal(gp, 1_092_000 - 583_200);
    assert.equal(canonical.grossMargin, Math.round((gp / 1_092_000) * 1000) / 10);
    assert.equal(canonical.netMargin, Math.round((237_000 / 1_092_000) * 1000) / 10);
    assert.equal(canonical.annualizationLabel, 'TTM');
  });

  it('prior period insufficient when coverage < 80% or base < $1000', () => {
    assert.equal(
      priorPeriodIsSufficient({ monthsWithData: 2, monthCount: 12, total: 50_000 }),
      false
    );
    assert.equal(
      priorPeriodIsSufficient({ monthsWithData: 11, monthCount: 12, total: 500 }),
      false
    );
    assert.equal(
      priorPeriodIsSufficient({ monthsWithData: 10, monthCount: 12, total: 50_000 }),
      true
    );
    const counts = countMonthsWithData([0, 0, 100, 200, 0, 50, 0, 0, 0, 0, 0, 0]);
    assert.equal(counts.monthsWithData, 3);
    assert.equal(counts.monthCount, 12);
  });

  it('leverage meta → Balance Sheet, never P&L via ebitda keyword', () => {
    assert.equal(resolveInsightMetaKey({ title: 'High Leverage (Debt-to-EBITDA)', category: 'Margins', metric: 'Debt-to-EBITDA' }), 'leverage');
    assert.equal(INSIGHT_META.leverage.linkTo, 'balance_sheet');
    const link = reportLinkForInsight(
      { title: 'High Leverage (Debt-to-EBITDA)', category: 'Margins', metric: 'Debt-to-EBITDA (TTM)' },
      '12m'
    );
    assert.ok(link?.href.includes('balance_sheet'));
    assert.ok(!link?.href.includes('pnl'));
  });

  it('suppressInvalidInsights drops runway countdown when net cash >= 0', () => {
    const ctx = {
      summary: {
        revenue: 100,
        expenses: 50,
        net_income: 50,
        profit_margin_pct: 50,
        cash: 10_000,
        accounts_receivable: 0,
        accounts_payable: 0,
      },
      derived: {
        trailingNetCashFlow: 1_000,
        priorPeriodSufficient: true,
      },
      balanceSheet: null,
    } as unknown as FinancialContext;

    const insights: AIInsight[] = [
      insight({
        id: 'r',
        title: 'Cash Runway Critical',
        category: 'Cash Runway',
        description: 'Only 1 month left',
        urgency: 'warning',
        metric: 'Cash Runway',
        metricValue: '1 mo',
      }),
      insight({
        id: 'ok',
        title: 'Healthy Leverage (Debt-to-EBITDA)',
        category: 'Leverage',
        description: 'Debt is fine',
        urgency: 'positive',
        metric: 'Debt-to-EBITDA (TTM)',
        metricValue: '1.2x',
      }),
    ];
    const kept = suppressInvalidInsights(insights, ctx);
    assert.equal(kept.some((i) => i.id === 'r'), false);
    assert.equal(kept.some((i) => i.id === 'ok'), true);
  });
});
