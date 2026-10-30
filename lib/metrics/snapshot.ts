/**

 * Persist and load immutable metrics snapshots — single source of truth per sync.

 */

import { supabaseAdmin } from '@/lib/qbo/supabaseAdmin';

import { loadClientMetrics } from '@/lib/metrics/loadClientMetrics';

import { loadClientAging } from '@/lib/metrics/loadAging';

import { loadIntegratedReportRaw } from '@/lib/metrics/loadIntegratedReport';

import { resolveMonthlyNetCash } from '@/lib/metrics/netCashFlow';

import { loadClientBasisSettings } from '@/lib/qbo/clientBasis';

import { computeMetrics, type MetricsSnapshotPayload } from '@/lib/metrics/computeMetrics';

import type { ReportRange } from '@/lib/qbo/reports';



export type MetricsSnapshotRow = {

  id: string;

  client_id: string;

  range: ReportRange;

  computed_at: string;

  metrics: MetricsSnapshotPayload;

};



export async function buildMetricsSnapshot(

  clientId: string,

  range: ReportRange = '12m'

): Promise<MetricsSnapshotPayload | null> {

  const [bundle, basis, agingData, cfRaw] = await Promise.all([

    loadClientMetrics(clientId, range),

    loadClientBasisSettings(clientId),

    loadClientAging(clientId, { liveIfEmpty: true }),

    loadIntegratedReportRaw(clientId, range, 'cash_flow').catch(() => null),

  ]);



  if (!bundle.hasData || !bundle.summary) return null;



  const windowTrends = bundle.windowTrends.length ? bundle.windowTrends : bundle.trends;

  const windowPeriodCount = windowTrends.length || 1;

  const monthlyNetCash = cfRaw

    ? resolveMonthlyNetCash(cfRaw, windowPeriodCount)

    : null;



  const hasInvoicing = basis.hasInvoicingActivity === true;



  return computeMetrics({

    summary: bundle.summary,

    trends: windowTrends,

    range,

    aging: hasInvoicing

      ? {

          ar: agingData.ar,

          ap: agingData.ap,

          asOfDate: agingData.asOfDate,

        }

      : null,

    hasInvoicingActivity: hasInvoicing,

    displayBasis: basis.displayBasis,

    trailingNetCashFlow: monthlyNetCash?.netCashFlowMonthly ?? null,

    currentPeriodIncomplete: bundle.currentPeriodIncomplete,

    windowPeriodCount,

    monthlyNetCash,

    reconciledCfMonths: monthlyNetCash?.monthlyValues,

  });

}



export async function saveMetricsSnapshot(

  clientId: string,

  range: ReportRange,

  metrics: MetricsSnapshotPayload

): Promise<string | null> {

  const sb = supabaseAdmin();

  const { data, error } = await sb

    .from('metrics_snapshots')

    .insert({

      client_id: clientId,

      range,

      metrics,

    })

    .select('id')

    .single();



  if (error) {

    console.warn('[snapshot] save failed (table may be missing)', error.message);

    return null;

  }

  return (data?.id as string) ?? null;

}



export async function getLatestMetricsSnapshot(

  clientId: string,

  range: ReportRange

): Promise<MetricsSnapshotRow | null> {

  const sb = supabaseAdmin();

  const { data, error } = await sb

    .from('metrics_snapshots')

    .select('id, client_id, range, computed_at, metrics')

    .eq('client_id', clientId)

    .eq('range', range)

    .order('computed_at', { ascending: false })

    .limit(1)

    .maybeSingle();



  if (error) {

    console.warn('[snapshot] load failed', error.message);

    return null;

  }

  if (!data) return null;

  return data as MetricsSnapshotRow;

}



/** Build + persist snapshot; returns row id when DB available. */

export async function refreshMetricsSnapshot(

  clientId: string,

  range: ReportRange = '12m'

): Promise<{ snapshotId: string | null; metrics: MetricsSnapshotPayload } | null> {

  const metrics = await buildMetricsSnapshot(clientId, range);

  if (!metrics) return null;

  const snapshotId = await saveMetricsSnapshot(clientId, range, metrics);

  return { snapshotId, metrics };

}



/** Build snapshots for all standard ranges after sync. */
export async function refreshAllMetricsSnapshots(
  clientId: string
): Promise<{
  primarySnapshotId: string | null;
  ranges: ReportRange[];
  snapshotsByRange: Partial<Record<ReportRange, string | null>>;
}> {
  const ranges: ReportRange[] = ['3m', '6m', '12m'];
  let primarySnapshotId: string | null = null;
  const snapshotsByRange: Partial<Record<ReportRange, string | null>> = {};

  for (const range of ranges) {
    try {
      const result = await refreshMetricsSnapshot(clientId, range);
      if (result) {
        snapshotsByRange[range] = result.snapshotId;
        if (range === '12m') primarySnapshotId = result.snapshotId;
      }
    } catch (e) {
      console.warn('[snapshot] refresh failed', clientId, range, e);
    }
  }

  return { primarySnapshotId, ranges, snapshotsByRange };
}



/** Ensure a snapshot exists — build on the fly if DB empty. */

export async function ensureMetricsSnapshot(

  clientId: string,

  range: ReportRange

): Promise<{ snapshotId: string | null; metrics: MetricsSnapshotPayload } | null> {

  const existing = await getLatestMetricsSnapshot(clientId, range);

  if (existing) return { snapshotId: existing.id, metrics: existing.metrics };



  const built = await buildMetricsSnapshot(clientId, range);

  if (!built) return null;



  const snapshotId = await saveMetricsSnapshot(clientId, range, built);

  return { snapshotId, metrics: built };

}


