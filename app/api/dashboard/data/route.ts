import { NextRequest, NextResponse } from 'next/server';
import { guardClientAccess } from '@/lib/auth/clientAccess';
import { loadClientMetrics } from '@/lib/metrics/loadClientMetrics';
import { getLatestMetricsSnapshot, buildMetricsSnapshot } from '@/lib/metrics/snapshot';
import { getPercentChange } from '@/lib/financialData';
import { arOver30Ratio } from '@/lib/reporting/parseArAging';
import { supabaseAdmin } from '@/lib/qbo/supabaseAdmin';
import { fetchBankAccounts } from '@/lib/qbo/queryRunner';
import { buildReconciliationStatus } from '@/lib/qbo/reconciliationStatus';
import type { ReportRange } from '@/lib/qbo/reports';

type CoreHealth = 'good' | 'warn' | 'bad';

const AGGREGATION_TIMEOUT_MS = 15_000;
const BANK_FETCH_TIMEOUT_MS = 4_000;
const CACHE_TTL_MS = 60_000;

type CacheEntry = { body: unknown; expiresAt: number };
const DASHBOARD_CACHE = new Map<string, CacheEntry>();

function runwayHealth(months: number | null, cashFlowPositive?: boolean): CoreHealth {
  if (cashFlowPositive) return 'good';
  if (months == null) return 'warn';
  if (months < 2) return 'bad';
  if (months < 5) return 'warn';
  return 'good';
}

function arHealth(ratio: number): CoreHealth {
  if (ratio > 0.35) return 'bad';
  if (ratio > 0.25) return 'warn';
  return 'good';
}

function revenueHealth(pctChange: number): CoreHealth {
  if (pctChange < -15) return 'bad';
  if (pctChange < -5) return 'warn';
  return 'good';
}

function marginHealth(curr: number, prev: number): CoreHealth {
  const d = curr - prev;
  if (d < -5) return 'bad';
  if (d < -2) return 'warn';
  return 'good';
}

function cashHealth(cash: number, avgBurn: number): CoreHealth {
  if (avgBurn <= 0) return runwayHealth(cash > 0 ? 12 : 0);
  if (cash < avgBurn) return 'bad';
  if (cash < avgBurn * 2) return 'warn';
  return 'good';
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function resolveLastSyncId(clientId: string): Promise<string> {
  const sb = supabaseAdmin();
  const { data } = await sb
    .from('financial_reports')
    .select('synced_at')
    .eq('client_id', clientId)
    .order('synced_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.synced_at ?? 'none';
}

async function aggregateDashboard(clientId: string, range: ReportRange) {
  const [bundle, snapshotRow] = await Promise.all([
    loadClientMetrics(clientId, range),
    getLatestMetricsSnapshot(clientId, range),
  ]);

  let metrics = snapshotRow?.metrics ?? null;
  let snapshotId = snapshotRow?.id ?? null;
  if (!metrics) {
    metrics = await buildMetricsSnapshot(clientId, range);
  }

  // Reuse recon date already fetched inside loadClientMetrics — never hit QBO twice.
  const reconciliation = buildReconciliationStatus(bundle.lastReconciledDate);

  if (!bundle.hasData || !bundle.summary) {
    return {
      summary: null,
      previousSummary: null,
      period: null,
      trends: [],
      range,
      coreMetrics: null,
      reconciliation,
      snapshotId: null,
    };
  }

  const finSummary = bundle.summary;
  const snapshotSummary = metrics?.summary;
  const arBuckets = metrics?.aging?.ar ?? {
    total: snapshotSummary?.accountsReceivable ?? finSummary.accounts_receivable,
    current: 0,
    days1_30: 0,
    days31_60: 0,
    days61_90: 0,
    days91_plus: 0,
  };
  const finPrev = bundle.previousSummary ?? {
    revenue: 0,
    expenses: 0,
    total_costs: 0,
    net_income: 0,
    profit_margin_pct: 0,
    cash: 0,
    accounts_receivable: 0,
    accounts_payable: 0,
    cogs: 0,
    gross_profit: 0,
    current_assets: 0,
    current_liabilities: 0,
    inventory: 0,
    data_error: false,
  };

  const revPctChange = getPercentChange(finSummary.revenue, finPrev.revenue);
  const arRatioPast30 = arOver30Ratio(arBuckets);

  let bankCash = finSummary.cash;
  try {
    const bankAccounts = await withTimeout(
      fetchBankAccounts(clientId),
      BANK_FETCH_TIMEOUT_MS,
      'fetchBankAccounts'
    );
    const liveBank = bankAccounts.reduce((s, a) => s + a.balance, 0);
    if (liveBank > 0) bankCash = liveBank;
  } catch {
    /* use balance-sheet cash — never block the dashboard on live bank query */
  }

  const undepositedFunds = Math.max(0, finSummary.cash - bankCash);
  const cashFlowPositive = metrics?.cashFlowPositive ?? bundle.runway.cashFlowPositive === true;
  const cashRunwayMonths = cashFlowPositive ? null : (metrics?.runwayMonths ?? bundle.runway.runwayMonths);
  const trailingNetCashFlow =
    metrics?.netCashFlowMonthly ?? bundle.runway.trailingNetCashFlow ?? null;
  const netBurnForHealth =
    trailingNetCashFlow != null && trailingNetCashFlow < 0
      ? Math.abs(trailingNetCashFlow)
      : bundle.runway.monthlyBurn;

  const coreMetrics = {
    cashPosition: finSummary.cash,
    bankCash,
    undepositedFunds,
    revenueChangePct: Math.round(revPctChange * 10) / 10,
    profitMarginPct:
      Math.abs(finSummary.revenue) > 0.005 ? finSummary.profit_margin_pct : null,
    arAging: arBuckets,
    cashRunwayMonths,
    cashFlowPositive,
    trailingNetCashFlow,
    quickRatio: metrics?.quickRatio ?? null,
    currentRatio: metrics?.currentRatio ?? null,
    dso: metrics?.dso ?? null,
    dataError: finSummary.data_error,
    excludedPartialMonth: bundle.excludedPartialMonth,
    currentPeriodIncomplete: bundle.currentPeriodIncomplete,
    anchoredToReconciled: bundle.anchoredToReconciled,
    displayPeriodLabel: bundle.displayPeriodLabel,
    health: {
      runway: runwayHealth(cashRunwayMonths, cashFlowPositive),
      ar: arHealth(arRatioPast30),
      revenue: bundle.currentPeriodIncomplete ? 'warn' : revenueHealth(revPctChange),
      margin: bundle.currentPeriodIncomplete
        ? 'warn'
        : marginHealth(finSummary.profit_margin_pct, finPrev.profit_margin_pct),
      cash: cashHealth(finSummary.cash, netBurnForHealth),
    },
  };

  const latestPeriod = bundle.periods[bundle.periods.length - 1];

  return {
    summary: {
      revenue: finSummary.revenue,
      expenses: finSummary.total_costs,
      net_income: finSummary.net_income,
      profit_margin_pct: finSummary.profit_margin_pct,
      cash: finSummary.cash,
      accounts_receivable: snapshotSummary?.accountsReceivable ?? finSummary.accounts_receivable,
      accounts_payable: snapshotSummary?.accountsPayable ?? finSummary.accounts_payable,
    },
    previousSummary: bundle.previousSummary
      ? {
          revenue: finPrev.revenue,
          expenses: finPrev.total_costs,
          net_income: finPrev.net_income,
          profit_margin_pct: finPrev.profit_margin_pct,
          cash: finPrev.cash,
          accounts_receivable: finPrev.accounts_receivable,
          accounts_payable: finPrev.accounts_payable,
        }
      : null,
    period: latestPeriod
      ? {
          id: latestPeriod.id,
          label: latestPeriod.label,
          start_date: latestPeriod.start_date,
          end_date: latestPeriod.end_date,
        }
      : null,
    trends: bundle.trends,
    range,
    coreMetrics,
    reconciliation,
    snapshotId,
  };
}

/**
 * GET /api/dashboard/data?clientId=xxx&range=3m|6m|12m|4q
 */
export async function GET(request: NextRequest) {
  const clientId = request.nextUrl.searchParams.get('clientId');
  const range = (request.nextUrl.searchParams.get('range') ?? '12m') as ReportRange;

  const access = await guardClientAccess(clientId);
  if (!access.ok) return access.response;

  try {
    // Resolve cache key from latest sync first (cheap DB lookup), then serve or aggregate.
    const lastSyncId = await resolveLastSyncId(access.clientId);
    const cacheKey = `${access.clientId}:${range}:${lastSyncId}`;
    const cached = DASHBOARD_CACHE.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.body);
    }

    const payload = await withTimeout(
      aggregateDashboard(access.clientId, range),
      AGGREGATION_TIMEOUT_MS,
      'dashboard aggregation'
    );

    DASHBOARD_CACHE.set(cacheKey, {
      body: payload,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Dashboard aggregation failed';
    console.error('[dashboard/data]', message);
    return NextResponse.json(
      { error: message.includes('timed out') ? 'Dashboard load timed out. Please retry.' : message },
      { status: 504 }
    );
  }
}
