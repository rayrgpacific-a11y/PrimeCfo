/**

 * Unified A/R and A/P aging load — always prefer dedicated aging snapshot over BS lines.

 */

import { supabaseAdmin } from '@/lib/qbo/supabaseAdmin';

import {

  parseArAgingBuckets,

  agingParseDiagnostics,

  type AgingBuckets,

} from '@/lib/reporting/parseArAging';

import { fetchArAgingSummary, fetchApAgingSummary } from '@/lib/qbo/forecastReports';

import { alertInternal } from '@/lib/alerts/internalAlert';



export type { AgingBuckets };



export type ClientAgingData = {

  ar: AgingBuckets;

  ap: AgingBuckets;

  asOfDate: string | null;

  syncedAt: string | null;

  source: 'snapshot' | 'financial_reports' | 'live' | 'none';

};



const ZERO: AgingBuckets = {

  total: 0,

  current: 0,

  days1_30: 0,

  days31_60: 0,

  days61_90: 0,

  days91_plus: 0,

};



function bucketsFromStored(

  stored: unknown,

  raw: unknown | null | undefined

): AgingBuckets {

  const fromStored = stored as AgingBuckets | undefined;

  if (fromStored && fromStored.total > 0) return fromStored;

  if (raw) {

    const reparsed = parseArAgingBuckets(raw);

    if (reparsed.total > 0) return reparsed;

  }

  return fromStored && typeof fromStored === 'object' ? (fromStored as AgingBuckets) : ZERO;

}



/** Persist parsed aging buckets after sync (basis-independent). */

export async function saveClientAgingSnapshot(

  clientId: string,

  arRaw: unknown,

  apRaw: unknown,

  asOfDate: string,

  opts?: { hasInvoicingActivity?: boolean }

): Promise<AgingBuckets> {

  const arDiag = agingParseDiagnostics(arRaw);

  const apDiag = agingParseDiagnostics(apRaw);

  const arBuckets = arDiag.buckets;

  const apBuckets = apDiag.buckets;



  console.info(

    '[aging] sync parse',

    JSON.stringify({

      clientId,

      asOfDate,

      ar: { qboRowCount: arDiag.qboRowCount, parsedTotal: arDiag.parsedTotal },

      ap: { qboRowCount: apDiag.qboRowCount, parsedTotal: apDiag.parsedTotal },

    })

  );



  if (

    opts?.hasInvoicingActivity &&

    arDiag.qboRowCount > 0 &&

    arDiag.parsedTotal === 0

  ) {

    void alertInternal(

      'AR aging parse returned $0',

      `clientId=${clientId} qboRowCount=${arDiag.qboRowCount} parsedTotal=0 asOf=${asOfDate}`

    );

  }



  const sb = supabaseAdmin();

  await sb.from('client_aging_snapshots').upsert(

    {

      client_id: clientId,

      as_of_date: asOfDate,

      ar_buckets: arBuckets,

      ap_buckets: apBuckets,

      ar_raw: arRaw as Record<string, unknown>,

      ap_raw: apRaw as Record<string, unknown>,

      synced_at: new Date().toISOString(),

    },

    { onConflict: 'client_id' }

  );



  return arBuckets;

}



/** Pull aging from QBO and persist — call on every sync when invoicing activity exists. */

export async function syncClientAgingFromQbo(

  clientId: string,

  opts?: { hasInvoicingActivity?: boolean }

): Promise<AgingBuckets | null> {

  const asOf = new Date().toISOString().slice(0, 10);

  try {

    const [arRaw, apRaw] = await Promise.all([

      fetchArAgingSummary(clientId, asOf, 'Accrual'),

      fetchApAgingSummary(clientId, asOf, 'Accrual'),

    ]);

    return await saveClientAgingSnapshot(clientId, arRaw, apRaw, asOf, opts);

  } catch (e) {

    console.error('[aging] syncClientAgingFromQbo failed', clientId, e);

    return null;

  }

}



/**

 * Load aging for metrics — snapshot table first, then financial_reports, optional live refresh.

 */

export async function loadClientAging(

  clientId: string,

  opts?: { liveIfEmpty?: boolean }

): Promise<ClientAgingData> {

  const sb = supabaseAdmin();



  const { data: snap } = await sb

    .from('client_aging_snapshots')

    .select('ar_buckets, ap_buckets, ar_raw, ap_raw, as_of_date, synced_at')

    .eq('client_id', clientId)

    .maybeSingle();



  if (snap?.ar_buckets) {

    const ar = bucketsFromStored(snap.ar_buckets, snap.ar_raw);

    const ap = bucketsFromStored(snap.ap_buckets, snap.ap_raw);

    if (ar.total > 0 || ap.total > 0 || snap.synced_at) {

      return {

        ar,

        ap,

        asOfDate: snap.as_of_date,

        syncedAt: snap.synced_at,

        source: 'snapshot',

      };

    }

  }



  const { data: arReport } = await sb

    .from('financial_reports')

    .select('raw_json, synced_at')

    .eq('client_id', clientId)

    .eq('report_type', 'ar_aging')

    .order('synced_at', { ascending: false })

    .limit(1)

    .maybeSingle();



  const { data: apReport } = await sb

    .from('financial_reports')

    .select('raw_json, synced_at')

    .eq('client_id', clientId)

    .eq('report_type', 'ap_aging')

    .order('synced_at', { ascending: false })

    .limit(1)

    .maybeSingle();



  let ar = parseArAgingBuckets(arReport?.raw_json ?? {});

  let ap = parseArAgingBuckets(apReport?.raw_json ?? {});



  if (ar.total > 0) {

    return {

      ar,

      ap,

      asOfDate: null,

      syncedAt: arReport?.synced_at ?? null,

      source: 'financial_reports',

    };

  }



  if (opts?.liveIfEmpty) {

    const live = await syncClientAgingFromQbo(clientId, { hasInvoicingActivity: true });

    if (live && live.total > 0) {

      const { data: refreshed } = await sb

        .from('client_aging_snapshots')

        .select('ar_buckets, ap_buckets, as_of_date, synced_at')

        .eq('client_id', clientId)

        .maybeSingle();

      if (refreshed) {

        return {

          ar: refreshed.ar_buckets as AgingBuckets,

          ap: (refreshed.ap_buckets as AgingBuckets) ?? ZERO,

          asOfDate: refreshed.as_of_date,

          syncedAt: refreshed.synced_at,

          source: 'live',

        };

      }

    }

  }



  return { ar, ap, asOfDate: null, syncedAt: null, source: 'none' };

}

