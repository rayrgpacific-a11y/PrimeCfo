/**
 * Build canonical report payload for PDF + monthly email consumers.
 */
import { loadClientMetrics } from '@/lib/metrics/loadClientMetrics';
import { getLatestMetricsSnapshot, buildMetricsSnapshot } from '@/lib/metrics/snapshot';
import { snapshotToAnalyticsKpis } from '@/lib/metrics/snapshotKpis';
import { supabaseAdmin } from '@/lib/qbo/supabaseAdmin';
import { loadClientBasisSettings } from '@/lib/qbo/clientBasis';
import type { ReportRange } from '@/lib/qbo/reports';

export type ReportPdfData = {
  companyName: string;
  range: ReportRange;
  rangeLabel: string;
  generatedAt: string;
  displayBasis: 'Cash' | 'Accrual';
  summary: {
    revenue: number;
    expenses: number;
    netIncome: number;
    cash: number;
    grossMargin: number | null;
    netMargin: number | null;
    currentRatio: number | null;
    quickRatio: number | null;
    dso: number | null;
    runwayMonths: number | null;
  };
  arAging: {
    total: number;
    current: number;
    days1_30: number;
    days31_60: number;
    days61_90: number;
    days91_plus: number;
  } | null;
  monthly: Array<{ label: string; revenue: number; expenses: number; profit: number }>;
};

const RANGE_LABELS: Record<ReportRange, string> = {
  '3m': 'Last 3 Months',
  '6m': 'Last 6 Months',
  '12m': 'Trailing 12 Months',
  '4q': 'Last 4 Quarters',
};

function money(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

export { money };

export async function buildReportPdfData(
  clientId: string,
  range: ReportRange,
  companyName?: string
): Promise<ReportPdfData> {
  const sb = supabaseAdmin();
  const [bundle, basis, clientRowResult, snapshotRow] = await Promise.all([
    loadClientMetrics(clientId, range),
    loadClientBasisSettings(clientId),
    sb.from('clients').select('company_name, client_name').eq('client_id', clientId).maybeSingle(),
    getLatestMetricsSnapshot(clientId, range),
  ]);

  const clientRow = clientRowResult.data;

  let metrics = snapshotRow?.metrics ?? null;
  if (!metrics) {
    metrics = await buildMetricsSnapshot(clientId, range);
  }

  const kpis = metrics ? snapshotToAnalyticsKpis(metrics) : null;
  const arBuckets = metrics?.aging?.ar ?? null;

  const summary = bundle.summary;
  const monthly = bundle.windowTrends.map((t) => ({
    label: t.periodLabel,
    revenue: t.revenue,
    expenses: t.expenses,
    profit: t.profit,
  }));

  return {
    companyName:
      companyName?.trim() ||
      clientRow?.company_name ||
      clientRow?.client_name ||
      'Client',
    range,
    rangeLabel: RANGE_LABELS[range] ?? range,
    generatedAt: new Date().toISOString(),
    displayBasis: basis.displayBasis,
    summary: {
      revenue: summary?.revenue ?? 0,
      expenses: summary?.total_costs ?? 0,
      netIncome: summary?.net_income ?? 0,
      cash: summary?.cash ?? 0,
      grossMargin: kpis?.grossMargin ?? null,
      netMargin: kpis?.netMargin ?? null,
      currentRatio: kpis?.currentRatio ?? null,
      quickRatio: kpis?.quickRatio ?? null,
      dso: kpis?.dso ?? null,
      runwayMonths: kpis?.runway ?? null,
    },
    arAging: arBuckets && arBuckets.total > 0 ? arBuckets : null,
    monthly,
  };
}
