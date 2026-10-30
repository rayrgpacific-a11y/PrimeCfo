import type { AIInsight } from '@/lib/financialData';
import type { ReportRange } from '@/lib/qbo/reports';
import { applyInsightMeta, resolveInsightMetaKey, INSIGHT_META, reportHref } from '@/lib/ai/insightMeta';

function haystack(insight: Pick<AIInsight, 'title' | 'category' | 'metric'>): string {
  return `${insight.title} ${insight.category} ${insight.metric ?? ''}`.toLowerCase();
}

/**
 * Deep-link from static registry first; keyword fallback only when no registry key matches.
 * Leverage / debt-to-EBITDA must NEVER route to P&L via an "ebitda" keyword match.
 */
export function reportLinkForInsight(
  insight: Pick<AIInsight, 'title' | 'category' | 'metric'>,
  range: ReportRange = '3m'
): { href: string; label: string } | undefined {
  const key = resolveInsightMetaKey(insight);
  if (key) {
    const meta = INSIGHT_META[key];
    return { href: reportHref(meta.linkTo, range), label: meta.linkLabel };
  }

  const hay = haystack(insight);

  if (
    hay.includes('cash') ||
    hay.includes('runway') ||
    hay.includes('breakeven') ||
    hay.includes('draw')
  ) {
    return {
      href: `/reports?tab=reports&report=cash_flow&range=${range}`,
      label: 'Cash Flow Statement',
    };
  }

  if (
    hay.includes('revenue') ||
    hay.includes('margin') ||
    hay.includes('profit') ||
    hay.includes('growth capacity')
  ) {
    return {
      href: `/reports?tab=reports&report=pnl&range=${range}`,
      label: 'P&L',
    };
  }

  if (
    hay.includes('liquidity') ||
    hay.includes('equity') ||
    hay.includes('ratio') ||
    hay.includes('balance sheet') ||
    hay.includes('solvency')
  ) {
    return {
      href: `/reports?tab=reports&report=balance_sheet&range=${range}`,
      label: 'Balance Sheet',
    };
  }

  return undefined;
}

const NEXT_STEP_RULES: Array<{
  match: (insight: AIInsight) => boolean;
  step: string;
}> = [
  {
    match: (i) => i.title.toLowerCase().includes('thin quick liquidity'),
    step:
      'Review payables timing over the next 30 days and ensure cash on hand covers obligations before taking any large distributions.',
  },
  {
    match: (i) =>
      i.title.toLowerCase().includes('moderate leverage') ||
      (i.metric?.toLowerCase().includes('debt-to-ebitda') === true && i.urgency === 'info'),
    step: 'Monitor debt paydown schedule — keep EBITDA at or above current levels to maintain coverage.',
  },
  {
    match: (i) => i.title.toLowerCase().includes('operating near breakeven'),
    step: 'Watch for months where draws or one-time costs push net burn materially negative.',
  },
  {
    match: (i) => i.title.toLowerCase().includes('elevated leverage'),
    step: 'Prioritize a deleveraging plan and review high-interest revolving balances for paydown.',
  },
  {
    match: (i) => i.title.toLowerCase().includes('high leverage'),
    step: 'Build debt paydown into your cash flow plan and discuss refinancing options with your advisor.',
  },
  {
    match: (i) => i.title.toLowerCase().includes('tight debt service'),
    step: 'Map loan payment due dates against cash collection cycles before taking distributions.',
  },
  {
    match: (i) => i.title.toLowerCase().includes('cash runway') && i.urgency !== 'positive',
    step: 'Review the drivers of negative cash flow — draws, loan payments, and operating outflows — before major spending.',
  },
  {
    match: (i) =>
      i.urgency === 'watch' &&
      !i.description.toLowerCase().includes('next step:') &&
      (i.title.toLowerCase().includes('revenue') || i.category.toLowerCase().includes('revenue')),
    step: 'Validate whether the trend is seasonal or structural before adjusting hiring or spend.',
  },
];

function findNextStep(insight: AIInsight): { step: string; explicit: boolean } | null {
  for (const rule of NEXT_STEP_RULES) {
    if (rule.match(insight)) return { step: rule.step, explicit: true };
  }
  if (
    (insight.urgency === 'warning' || insight.urgency === 'watch' || insight.urgency === 'critical') &&
    !insight.description.toLowerCase().includes('next step:')
  ) {
    return {
      step: 'Discuss this trend with your advisor and validate the underlying numbers in QuickBooks before acting.',
      explicit: false,
    };
  }
  return null;
}

/** Strip retained-earnings phrasing that reappears from LLM templates. */
function scrubRetainedEarningsCopy(text: string): string {
  return text
    .replace(/negative retained earnings of \$[\d,]+(?:\.\d+)?/gi, 'owner draws that exceed book equity')
    .replace(/retained earnings of \$[\d,]+(?:\.\d+)?/gi, 'owner draws')
    .replace(/negative retained earnings/gi, 'owner-draw-driven negative equity')
    .replace(/retained earnings/gi, 'owner draws');
}

export function enrichInsights(
  insights: AIInsight[],
  range: ReportRange = '3m'
): AIInsight[] {
  return insights.map((insight) => {
    const scrubbed: AIInsight = {
      ...insight,
      description: scrubRetainedEarningsCopy(insight.description),
      title: scrubRetainedEarningsCopy(insight.title),
    };

    const meta = applyInsightMeta(scrubbed, range);
    const reportLink = meta.reportLink ?? reportLinkForInsight(scrubbed, range);
    const next = findNextStep(scrubbed);

    let description = scrubbed.description;
    if (next?.explicit && !description.toLowerCase().includes('next step:')) {
      description = `${description.trim()} Next step: ${next.step}`;
    } else if (next && !next.explicit && !description.toLowerCase().includes('next step:')) {
      description = `${description.trim()} Next step: ${next.step}`;
    }

    return {
      ...scrubbed,
      category: meta.category,
      description,
      reportLink,
    };
  });
}
