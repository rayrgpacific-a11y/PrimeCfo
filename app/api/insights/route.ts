import { NextRequest, NextResponse } from 'next/server';
import { guardClientAccess } from '@/lib/auth/clientAccess';
import { supabaseAdmin } from '@/lib/qbo/supabaseAdmin';
import { getFinancialContext } from '@/lib/ai/getFinancialContext';
import { applyTrendAwareInsightRules } from '@/lib/ai/trendAwareInsights';
import { computeRiskPosture } from '@/lib/ai/computeRiskPosture';
import { getLatestMetricsSnapshot } from '@/lib/metrics/snapshot';
import type { ReportRange } from '@/lib/qbo/reports';
import type { AIInsight, Recommendation, RiskPosture } from '@/lib/financialData';

type DbRow = {
  id: string;
  client_id: string;
  report_range: string | null;
  snapshot_id: string | null;
  title: string;
  description: string;
  urgency: string;
  category: string;
  metric: string | null;
  metric_value: string | null;
  recommendations: Recommendation[] | null;
  talking_points: string[] | null;
  severity_order: number;
  created_at: string;
};

type RiskPostureRow = {
  rating: string;
  summary: string;
  top_action: string | null;
};

const REFRESH_WINDOW_MS = 15 * 60 * 1000;

/**
 * GET /api/insights?clientId=xxx&range=3m|6m|12m|4q
 * Returns stored AI insights bound to the current metrics snapshot when available.
 */
export async function GET(request: NextRequest) {
  const clientId = request.nextUrl.searchParams.get('clientId');
  const range = request.nextUrl.searchParams.get('range') ?? '12m';

  const access = await guardClientAccess(clientId);
  if (!access.ok) return access.response;

  const sb = supabaseAdmin();
  const snapshotRow = await getLatestMetricsSnapshot(access.clientId, range as ReportRange);
  const currentSnapshotId = snapshotRow?.id ?? null;

  let query = sb
    .from('ai_insights')
    .select(
      'id, client_id, report_range, snapshot_id, title, description, urgency, category, metric, metric_value, recommendations, talking_points, severity_order, created_at'
    )
    .eq('client_id', clientId)
    .eq('report_range', range)
    .order('severity_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (currentSnapshotId) {
    query = query.eq('snapshot_id', currentSnapshotId);
  }

  let { data, error } = await query;

  // Insights saved before snapshot_id migration — show latest for range.
  if (currentSnapshotId && (!data || data.length === 0)) {
    const { data: legacy, error: legacyErr } = await sb
      .from('ai_insights')
      .select(
        'id, client_id, report_range, snapshot_id, title, description, urgency, category, metric, metric_value, recommendations, talking_points, severity_order, created_at'
      )
      .eq('client_id', clientId)
      .eq('report_range', range)
      .order('severity_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(20);
    if (!legacyErr && legacy && legacy.length > 0) {
      data = legacy;
      error = null;
    }
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as DbRow[];

  const snapshotAgeMs = snapshotRow?.computed_at
    ? Date.now() - new Date(snapshotRow.computed_at).getTime()
    : null;

  const needsGeneration =
    currentSnapshotId != null &&
    rows.length === 0 &&
    rows.every((r) => r.snapshot_id === currentSnapshotId || !r.snapshot_id);

  const refreshingInsights =
    needsGeneration &&
    snapshotAgeMs != null &&
    snapshotAgeMs < REFRESH_WINDOW_MS;

  const context = await getFinancialContext(access.clientId, range as ReportRange);

  const storedInsights: AIInsight[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    urgency: r.urgency as AIInsight['urgency'],
    category: r.category,
    metric: r.metric ?? undefined,
    metricValue: r.metric_value ?? undefined,
    recommendations: r.recommendations ?? undefined,
    talkingPoints: r.talking_points ?? undefined,
    createdAt: r.created_at,
  }));

  const insights =
    context && rows.length > 0
      ? applyTrendAwareInsightRules(storedInsights, context)
      : storedInsights;

  let riskPosture: RiskPosture | null = null;
  if (context && insights.length > 0) {
    riskPosture = computeRiskPosture(context, insights);
  } else if (!refreshingInsights) {
    const { data: rpData } = await sb
      .from('ai_risk_posture')
      .select('rating, summary, top_action')
      .eq('client_id', clientId)
      .eq('report_range', range)
      .maybeSingle();
    if (rpData) {
      const rp = rpData as RiskPostureRow;
      riskPosture = {
        rating: rp.rating as RiskPosture['rating'],
        summary: rp.summary,
        topAction: rp.top_action ?? '',
      };
    }
  }

  return NextResponse.json({
    insights,
    riskPosture,
    snapshotId: currentSnapshotId,
    refreshingInsights,
    needsGeneration: needsGeneration && !refreshingInsights,
  });
}
