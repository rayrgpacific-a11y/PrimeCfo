/**
 * Persist AI insights and risk posture to database.
 * Replaces existing insights for the same client + report_range.
 */

import { supabaseAdmin } from '@/lib/qbo/supabaseAdmin';
import type { AIInsight, RiskPosture, InsightSeverity } from '@/lib/financialData';
import { SEVERITY_ORDER } from './generateInsights';

export type SaveInsightsParams = {
  clientId: string;
  reportRange: string;
  periodId?: string | null;
  snapshotId?: string | null;
  insights: AIInsight[];
  riskPosture?: RiskPosture | null;
};

function getSeverityOrder(urgency: InsightSeverity): number {
  return SEVERITY_ORDER[urgency] ?? 4;
}

export async function saveInsights(params: SaveInsightsParams): Promise<void> {
  const { clientId, reportRange, periodId, snapshotId, insights, riskPosture } = params;
  const sb = supabaseAdmin();

  await sb
    .from('ai_insights')
    .delete()
    .eq('client_id', clientId)
    .eq('report_range', reportRange);

  if (insights.length > 0) {
    const baseRow = (includeSnapshot: boolean) =>
      insights.map((i) => ({
        client_id: clientId,
        period_id: periodId ?? null,
        report_range: reportRange,
        ...(includeSnapshot ? { snapshot_id: snapshotId ?? null } : {}),
        title: i.title,
        description: i.description,
        urgency: i.urgency,
        category: i.category,
        metric: i.metric ?? null,
        metric_value: i.metricValue ?? null,
        recommendations: i.recommendations ?? null,
        talking_points: i.talkingPoints ?? null,
        severity_order: getSeverityOrder(i.urgency),
      }));

    let { error } = await sb.from('ai_insights').insert(baseRow(true));
    if (error && /snapshot_id/i.test(error.message)) {
      ({ error } = await sb.from('ai_insights').insert(baseRow(false)));
    }
    if (error) throw new Error(error.message);
  }

  if (riskPosture) {
    await sb
      .from('ai_risk_posture')
      .delete()
      .eq('client_id', clientId)
      .eq('report_range', reportRange);

    const { error: rpError } = await sb.from('ai_risk_posture').insert({
      client_id: clientId,
      report_range: reportRange,
      rating: riskPosture.rating,
      summary: riskPosture.summary,
      top_action: riskPosture.topAction || null,
    });
    if (rpError) throw new Error(`Risk posture save failed: ${rpError.message}`);
  }
}
