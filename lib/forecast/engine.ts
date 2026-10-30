import type { TierCapabilities } from '@/lib/tiers';
import { deriveMetricsFromBalanceSheet } from '@/lib/deriveMetrics';
import { parseEntityBalance } from '@/lib/qbo/qbParseMoney';
import { assertMonthlyNetCashConsistency } from '@/lib/metrics/monthlyNetCash';
import type { ForecastInputs } from './inputs';
import type { CashFlowForecastResult, ForecastDayPoint } from './types';
import { deriveNetCashScenarioBands, medianOf } from './scenarioBands';

function resolveFallbackMonthlyNet(inputs: ForecastInputs): {
  value: number;
  basis: 'cash_flow_statement' | 'pnl_net_income_fallback';
} {
  if (
    inputs.avgMonthlyNetCashIncrease != null &&
    Number.isFinite(inputs.avgMonthlyNetCashIncrease)
  ) {
    return { value: inputs.avgMonthlyNetCashIncrease, basis: 'cash_flow_statement' };
  }

  if (inputs.avgMonthlyNetIncome != null && Number.isFinite(inputs.avgMonthlyNetIncome)) {
    return { value: inputs.avgMonthlyNetIncome, basis: 'pnl_net_income_fallback' };
  }

  const nets = inputs.netIncomes.filter((n) => Number.isFinite(n));
  if (nets.length > 0) {
    const trailing = nets.slice(-3);
    const avg = trailing.reduce((a, b) => a + b, 0) / trailing.length;
    return { value: avg, basis: 'pnl_net_income_fallback' };
  }

  return {
    value: inputs.avgMonthlyRevenue - inputs.avgMonthlyExpense,
    basis: 'pnl_net_income_fallback',
  };
}

function projectAtDay(bankBalance: number, monthlyNet: number, dayOffset: number): number {
  return bankBalance + monthlyNet * (dayOffset / 30);
}

/** Weekly anchors through horizon (0, 7, 14, …, horizon) for chart trajectory. */
export function forecastDayOffsets(horizonDays: number): number[] {
  const offsets = new Set<number>([0]);
  for (let d = 7; d < horizonDays; d += 7) offsets.add(d);
  offsets.add(horizonDays);
  return [...offsets].sort((a, b) => a - b);
}

/**
 * Cash forecast: compound median / percentile monthly net cash from reconciled full months.
 * Owner draws are separated so the UI can toggle "at current draw pace" vs "before draws".
 */
export function computeCashForecast(
  inputs: ForecastInputs,
  caps: TierCapabilities
): CashFlowForecastResult {
  if (caps.forecastDays === 0) {
    throw new Error('Forecast not available on Starter tier.');
  }
  const horizon = caps.forecastDays;

  const fallback = resolveFallbackMonthlyNet(inputs);
  const withDraws = inputs.reconciledMonthlyCash.map((p) => p.netCash);
  const beforeDraws = inputs.reconciledMonthlyCash.map((p) => p.netCash + p.ownerDraws);
  const avgMonthlyDraws =
    inputs.reconciledMonthlyCash.length > 0
      ? medianOf(inputs.reconciledMonthlyCash.map((p) => p.ownerDraws))
      : 0;

  const bandsWithDraws = deriveNetCashScenarioBands(withDraws, fallback.value);
  const bandsBeforeDraws = deriveNetCashScenarioBands(beforeDraws, fallback.value + avgMonthlyDraws);

  const weightedInflowsExpected = inputs.openInvoices.reduce(
    (s, inv) => s + parseEntityBalance(inv) * 0.85,
    0
  );
  const outflowsBills = inputs.openBills.reduce((s, b) => s + parseEntityBalance(b), 0);

  let referenceAr = weightedInflowsExpected;
  let referenceAp = outflowsBills;

  if (inputs.balanceSheetSnapshot) {
    const bsEntries = deriveMetricsFromBalanceSheet(inputs.balanceSheetSnapshot);
    const arEntry = bsEntries.find((e) => e.metric_key === 'accounts_receivable');
    const apEntry = bsEntries.find((e) => e.metric_key === 'accounts_payable');
    if (arEntry != null) referenceAr = arEntry.value;
    if (apEntry != null) referenceAp = apEntry.value;
  } else if (inputs.balanceSheetArAp) {
    referenceAr = inputs.balanceSheetArAp.ar;
    referenceAp = inputs.balanceSheetArAp.ap;
  }

  assertMonthlyNetCashConsistency(
    'CF statement monthly net',
    fallback.basis === 'cash_flow_statement' ? fallback.value : null,
    'forecast expected monthly step',
    bandsWithDraws.usedDefaults && fallback.basis === 'cash_flow_statement'
      ? bandsWithDraws.expectedMonthlyNet
      : null
  );

  let balanceSheetCash: number | null = null;
  let bankVsStatementDelta: number | null = null;
  if (caps.includeBalanceSheetCf && inputs.balanceSheetSnapshot) {
    const entries = deriveMetricsFromBalanceSheet(inputs.balanceSheetSnapshot);
    const cashEntry = entries.find((e) => e.metric_key === 'cash');
    if (cashEntry && typeof cashEntry.value === 'number') {
      balanceSheetCash = cashEntry.value;
      bankVsStatementDelta = inputs.bankBalance - balanceSheetCash;
    }
  }

  const offsets = forecastDayOffsets(horizon);

  const buildSeries = (
    expectedMonthly: number,
    bestMonthly: number,
    worstMonthly: number
  ): ForecastDayPoint[] =>
    offsets.map((dayOffset) => ({
      dayOffset,
      expected: projectAtDay(inputs.bankBalance, expectedMonthly, dayOffset),
      optimistic: caps.scenarios
        ? projectAtDay(inputs.bankBalance, bestMonthly, dayOffset)
        : undefined,
      conservative: caps.scenarios
        ? projectAtDay(inputs.bankBalance, worstMonthly, dayOffset)
        : undefined,
    }));

  const series = buildSeries(
    bandsWithDraws.expectedMonthlyNet,
    bandsWithDraws.bestMonthlyNet,
    bandsWithDraws.worstMonthlyNet
  );
  const seriesBeforeDraws = buildSeries(
    bandsBeforeDraws.expectedMonthlyNet,
    bandsBeforeDraws.bestMonthlyNet,
    bandsBeforeDraws.worstMonthlyNet
  );

  const last = series[series.length - 1];

  // Shortfall: first day the raw worst-case path crosses below zero
  let worstCaseShortfall: { amount: number; dayOffset: number } | null = null;
  if (caps.scenarios) {
    for (const dayOffset of offsets) {
      const cash = projectAtDay(inputs.bankBalance, bandsWithDraws.worstMonthlyNet, dayOffset);
      if (cash < 0) {
        worstCaseShortfall = { amount: Math.abs(cash), dayOffset };
        break;
      }
    }
  }

  return {
    asOf: inputs.asOf,
    tier: caps.tier,
    bankBalance: inputs.bankBalance,
    components: {
      expectedInflowsWeighted: referenceAr,
      expectedOutflowsBills: referenceAp,
      estimatedRecurringMonthly: bandsWithDraws.expectedMonthlyNet,
      recurringBasis:
        bandsWithDraws.usedDefaults && fallback.basis === 'pnl_net_income_fallback'
          ? 'pnl_net_income_fallback'
          : 'cash_flow_statement',
      collectionRate: 0.85,
      arApWindowDays: inputs.arApWindowDays,
      balanceSheetCash,
      bankVsStatementDelta,
      avgMonthlyOperatingCashNet: inputs.avgMonthlyNetCashIncrease,
      includesOpenArApInProjection: false,
      scenarioSampleCount: bandsWithDraws.sampleCount,
      scenarioUsedDefaults: bandsWithDraws.usedDefaults,
      scenarioBestMonthlyNet: bandsWithDraws.bestMonthlyNet,
      scenarioWorstMonthlyNet: bandsWithDraws.worstMonthlyNet,
      avgMonthlyOwnerDraws: avgMonthlyDraws,
      scenarioMethodology:
        'Scenarios are based on your last 6 months of actual reconciled cash flow (20th–80th percentile months).',
    },
    horizonDays: horizon,
    endingCashExpected:
      last?.expected ??
      projectAtDay(inputs.bankBalance, bandsWithDraws.expectedMonthlyNet, horizon),
    series,
    seriesBeforeDraws,
    worstCaseShortfall,
  };
}
