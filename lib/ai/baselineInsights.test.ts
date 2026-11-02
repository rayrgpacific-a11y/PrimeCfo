import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateDeterministicInsights, buildBaselineInsights } from './generateInsights';
import type { FinancialContext } from './getFinancialContext';

function createMockContext(overrides?: Partial<FinancialContext>): FinancialContext {
  return {
    periodLabel: 'Last 4 Quarters',
    reportRange: '4q',
    summary: {
      revenue: 250000,
      expenses: 180000,
      net_income: 70000,
      profit_margin_pct: 28.0,
      cash: 65000,
      accounts_receivable: 35000,
      accounts_payable: 20000,
    },
    previousSummary: null,
    trends: [],
    derived: {
      revenueGrowthPct: null,
      expenseGrowthPct: null,
      profitMarginChangePct: null,
      runwayMonths: null,
      netRunwayMonths: null,
      trailingNetCashFlow: 5000,
      ownerCompensation: null,
      taxExpense: null,
      grossMarginPct: 45.0,
      operatingLeverageRatio: null,
      expenseToRevenueRatio: 72.0,
      revenueLineItems: [],
      previousRevenueLineItems: [],
      recurringRevenueChangePct: null,
      debtToEbitda: null,
      debtServiceCoverage: null,
      incrementalMarginPct: null,
      dataError: false,
      excludedPartialMonth: false,
      currentPeriodIncomplete: false,
      displayBasis: 'Accrual',
      openArTotal: 35000,
      hasInvoicingActivity: true,
      priorPeriodSufficient: false,
      annualizationLabel: null,
    },
    metricsSnapshot: null,
    balanceSheet: null,
    balanceSheetContext: null,
    ...overrides,
  };
}

test('generateDeterministicInsights produces guaranteed cards when priorPeriodSufficient is false', () => {
  const ctx = createMockContext();
  const res = generateDeterministicInsights(ctx);

  assert.ok(res.insights.length >= 2, `Expected at least 2 insights, got ${res.insights.length}`);
  assert.ok(res.riskPosture, 'Expected valid risk posture');

  for (const insight of res.insights) {
    assert.ok(insight.title && insight.title.length > 0, 'Insight must have a title');
    assert.ok(insight.description && insight.description.length > 0, 'Insight must have a description');
    assert.ok(insight.metric, 'Insight must have a metric');
    assert.ok(insight.metricValue, 'Insight must have a metricValue');
    if (insight.recommendations && insight.recommendations.length > 0) {
      for (const rec of insight.recommendations) {
        assert.ok(rec.action && rec.action.length > 0, 'Recommendation must have action');
        assert.ok(rec.expectedImpact && rec.expectedImpact.length > 0, 'Recommendation must have expectedImpact');
      }
    }
    assert.ok(Array.isArray(insight.talkingPoints) && insight.talkingPoints.length > 0, 'Must have talking points');
  }
});

test('buildBaselineInsights produces 3 actionable recommendations per card', () => {
  const ctx = createMockContext();
  const insights = buildBaselineInsights(ctx);

  assert.ok(insights.length >= 2, 'Expected at least 2 baseline insights');
  for (const insight of insights) {
    assert.ok(Array.isArray(insight.recommendations) && insight.recommendations.length >= 3, 'Must have at least 3 recommendations');
    for (const rec of insight.recommendations!) {
      assert.ok(rec.action && rec.action.length > 0, 'Action required');
      assert.ok(rec.expectedImpact && rec.expectedImpact.length > 0, 'Impact required');
    }
  }
});

test('buildBaselineInsights correctly classifies operating losses', () => {
  const ctx = createMockContext({
    summary: {
      revenue: 100000,
      expenses: 130000,
      net_income: -30000,
      profit_margin_pct: -30.0,
      cash: 15000,
      accounts_receivable: 10000,
      accounts_payable: 25000,
    },
    derived: {
      ...createMockContext().derived,
      trailingNetCashFlow: -5000,
      netRunwayMonths: 3.0,
    },
  });

  const insights = buildBaselineInsights(ctx);
  const lossInsight = insights.find((i) => i.title.includes('Margin') || i.title.includes('Overhead'));
  assert.ok(lossInsight, 'Expected overhead/margin loss insight');
  assert.ok(lossInsight.urgency === 'critical' || lossInsight.urgency === 'warning', 'Expected alert severity on loss');
});
