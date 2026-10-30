/**
 * Regenerate and persist AI insights bound to a metrics snapshot.
 * Raw LLM output is stored; trend-aware rules run at read time (GET /api/insights).
 */
import { getFinancialContext } from '@/lib/ai/getFinancialContext';
import { generateInsightsFromContext } from '@/lib/ai/generateInsights';
import { saveInsights } from '@/lib/ai/saveInsights';
import type { ReportRange } from '@/lib/qbo/reports';

export async function regenerateInsightsForClient(
  clientId: string,
  range: ReportRange,
  snapshotId: string | null
): Promise<{ insightCount: number } | null> {
  const context = await getFinancialContext(clientId, range);
  if (!context) return null;

  const { insights, riskPosture } = await generateInsightsFromContext(context);

  await saveInsights({
    clientId,
    reportRange: range,
    periodId: null,
    snapshotId,
    insights,
    riskPosture,
  });

  return { insightCount: insights.length };
}
