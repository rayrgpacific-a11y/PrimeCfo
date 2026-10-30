import { NextRequest, NextResponse } from 'next/server';
import { guardClientAccess } from '@/lib/auth/clientAccess';
import { getFinancialContext } from '@/lib/ai/getFinancialContext';
import { regenerateInsightsForClient } from '@/lib/ai/regenerateInsights';
import { applyTrendAwareInsightRules } from '@/lib/ai/trendAwareInsights';
import { computeRiskPosture } from '@/lib/ai/computeRiskPosture';
import { ensureMetricsSnapshot } from '@/lib/metrics/snapshot';
import { alertInternal } from '@/lib/alerts/internalAlert';
import type { ReportRange } from '@/lib/qbo/reports';

/**
 * POST /api/insights/generate
 * Body: { clientId: string, range?: '3m'|'6m'|'12m'|'4q' }
 */
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  let clientId: string | null = null;
  let range: ReportRange = '12m';

  try {
    const body = await request.json().catch(() => ({}));
    clientId = typeof body.clientId === 'string' ? body.clientId.trim() : null;
    if (body.range && ['3m', '6m', '12m', '4q'].includes(body.range)) range = body.range;
  } catch {
    // leave defaults
  }

  const access = await guardClientAccess(clientId);
  if (!access.ok) return access.response;

  try {
    const snapshotResult = await ensureMetricsSnapshot(access.clientId, range);
    if (!snapshotResult?.metrics) {
      return NextResponse.json(
        {
          error: 'no_snapshot',
          message: 'No metrics snapshot. Run Sync first.',
          requestId,
        },
        { status: 409 }
      );
    }

    const { snapshotId, metrics: snapshotMetrics } = snapshotResult;

    const context = await getFinancialContext(access.clientId, range);
    if (!context) {
      return NextResponse.json(
        {
          error: 'no_data',
          message: 'No financial data for this client and range.',
          requestId,
        },
        { status: 409 }
      );
    }

    // Never throw on missing aging — empty buckets are valid.
    const aging = snapshotMetrics.aging ?? {
      ar: {
        total: 0,
        current: 0,
        days1_30: 0,
        days31_60: 0,
        days61_90: 0,
        days91_plus: 0,
      },
      ap: {
        total: 0,
        current: 0,
        days1_30: 0,
        days31_60: 0,
        days61_90: 0,
        days91_plus: 0,
      },
      asOfDate: null,
    };
    void aging;

    await regenerateInsightsForClient(access.clientId, range, snapshotId);

    const { supabaseAdmin } = await import('@/lib/qbo/supabaseAdmin');
    const sb = supabaseAdmin();
    let query = sb
      .from('ai_insights')
      .select('*')
      .eq('client_id', access.clientId)
      .eq('report_range', range)
      .order('severity_order', { ascending: true });

    if (snapshotId) query = query.eq('snapshot_id', snapshotId);

    const { data: rows } = await query;
    const storedInsights = (rows ?? []).map((r) => ({
      id: r.id as string,
      title: r.title as string,
      description: r.description as string,
      urgency: r.urgency as import('@/lib/financialData').InsightSeverity,
      category: r.category as string,
      metric: (r.metric as string | null) ?? undefined,
      metricValue: (r.metric_value as string | null) ?? undefined,
      recommendations: r.recommendations as import('@/lib/financialData').Recommendation[] | undefined,
      talkingPoints: r.talking_points as string[] | undefined,
      createdAt: r.created_at as string,
    }));

    const insights = applyTrendAwareInsightRules(storedInsights, context);
    const riskPosture = computeRiskPosture(context, insights);

    return NextResponse.json({ insights, riskPosture, snapshotId, requestId });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[insights/generate]', { requestId, clientId: access.clientId, range, message, err });
    void alertInternal(
      'insights/generate failed',
      `requestId=${requestId} clientId=${access.clientId} range=${range}: ${message}`
    );
    return NextResponse.json(
      { error: 'generation_failed', message, requestId },
      { status: 502 }
    );
  }
}
