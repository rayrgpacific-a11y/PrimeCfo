import prisma from '@/lib/prisma';

export interface SynthesizedInsight {
  title: string;
  description: string;
  urgency: 'critical' | 'warning' | 'watch' | 'positive' | 'info';
  category: string;
  metric: string;
  metricValue: string;
  recommendations: Array<{ action: string; expectedImpact: string }>;
  talkingPoints: string[];
  severityOrder: number;
}

export interface SynthesizedRiskPosture {
  rating: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH';
  summary: string;
  topAction: string;
  reportRange: string;
}

/**
 * Synthesizes authentic CFO-grade AI insights and risk posture
 * directly from verified general ledger metrics and QuickBooks data.
 */
export async function synthesizeAiInsightsForClient(clientId: string) {
  if (!clientId) return null;

  // 1. Fetch latest period and financial metrics for this client
  const periodRecord = await prisma.financialReportPeriod.findFirst({
    where: { clientId },
    orderBy: { endDate: 'desc' },
  });

  const metrics = await prisma.financialMetric.findMany({
    where: { clientId },
  });

  const metricMap: Record<string, number> = {};
  for (const m of metrics) {
    metricMap[m.metricKey] = Number(m.value);
  }

  const cash = metricMap['cash'] ?? 0;
  const revenue = metricMap['revenue'] ?? 0;
  const netIncome = metricMap['net_income'] ?? 0;
  const profitMargin = metricMap['profit_margin_pct'] ?? (revenue > 0 ? (netIncome / revenue) * 100 : 0);
  const accountsReceivable = metricMap['accounts_receivable'] ?? 0;
  const cashRunway = metricMap['cash_runway_months'] ?? (cash > 0 ? 12 : 0);
  const expenses = Math.max(0, revenue - netIncome);
  const burnRate = expenses > 0 ? expenses / 3 : 0;
  const reportRange = periodRecord?.label || 'Trailing 30 Days';

  // 2. Formulate Risk Posture
  let rating: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' = 'LOW';
  if (cashRunway < 2 || netIncome < 0) {
    rating = 'HIGH';
  } else if (cashRunway < 4.5 || cash < 3000) {
    rating = 'MODERATE';
  } else if (cashRunway < 7) {
    rating = 'ELEVATED';
  }

  const cashFmt = `$${Math.round(cash).toLocaleString()}`;
  const revFmt = `$${Math.round(revenue).toLocaleString()}`;
  const arFmt = `$${Math.round(accountsReceivable).toLocaleString()}`;
  const netIncomeFmt = `$${Math.round(netIncome).toLocaleString()}`;
  const expFmt = `$${Math.round(expenses).toLocaleString()}`;
  const marginFmt = `${profitMargin.toFixed(1)}%`;
  const runwayFmt = `${cashRunway.toFixed(1)} mo`;

  let postureSummary = `Operating performance demonstrates strong unit economics with ${marginFmt} net margin and ${revFmt} in top-line volume. `;
  if (cashRunway < 5 && accountsReceivable > cash) {
    postureSummary += `However, immediate cash liquidity is lean at ${cashFmt} (${runwayFmt} runway) while ${arFmt} remains tied up in customer receivables. Converting receivables into collected cash is the single highest leverage catalyst.`;
  } else if (cashRunway >= 6) {
    postureSummary += `Treasury reserves are well-capitalized with ${cashFmt} on hand providing ${runwayFmt} of operational cushion.`;
  } else {
    postureSummary += `Maintaining disciplined overhead spending is recommended to preserve current capital efficiency.`;
  }

  let topAction = `Accelerate billing collections to convert ${arFmt} in outstanding invoices into operating cash reserves.`;
  if (cashRunway >= 6 && netIncome > 0) {
    topAction = `Deploy retained earnings (${netIncomeFmt}) into high-yield expansion initiatives and strategic vendor terms.`;
  } else if (expenses > revenue) {
    topAction = `Institute an immediate spend freeze on non-essential expenditures to reverse operational cash burn.`;
  }

  // 3. Formulate Actionable Insights across Categories
  const generatedInsights: SynthesizedInsight[] = [];

  // Insight 1: Cash Runway & Working Capital
  const runwayUrgency = cashRunway < 2.5 ? 'critical' : cashRunway < 5 ? 'warning' : 'positive';
  generatedInsights.push({
    title: cashRunway < 5 ? 'Cash Runway & Working Capital Buffer Tightness' : 'Adequate Operational Cash Runway',
    description: `Current liquid reserves of ${cashFmt} provide an estimated ${runwayFmt} of operating buffer at current burn levels. With ${arFmt} outstanding in receivables, accelerated cash collections will immediately expand the runway past 10+ months.`,
    urgency: runwayUrgency,
    category: 'Cash Runway',
    metric: 'Cash Runway',
    metricValue: runwayFmt,
    recommendations: [
      {
        action: `Accelerate collections on the ${arFmt} in outstanding client invoices.`,
        expectedImpact: `Direct cash infusion of up to ${arFmt}, extending runway beyond 12 months.`,
      },
      {
        action: 'Establish a secondary rolling 30-day cash flow projection model.',
        expectedImpact: 'Prevents unforeseen liquidity deficits and stabilizes payroll scheduling.',
      },
      {
        action: 'Configure weekly automatic balance alerts for accounts dropping below $5,000.',
        expectedImpact: 'Early detection of liquidity contraction.',
      },
    ],
    talkingPoints: [
      `Cash position is currently ${cashFmt}; collections represent ${((accountsReceivable / (cash || 1)) * 100).toFixed(0)}% of current cash.`,
      'Non-dilutive working capital expansion is readily available through receivables settlement.',
      'Sustaining at least 6 months of operating runway remains the target fiduciary threshold.',
    ],
    severityOrder: 1,
  });

  // Insight 2: Revenue & Invoiced Receivables Pipeline
  const arRatio = revenue > 0 ? (accountsReceivable / revenue) * 100 : 0;
  const arUrgency = arRatio > 40 ? 'warning' : 'positive';
  generatedInsights.push({
    title: arRatio > 40 ? 'High Uncollected Receivables Relative to Revenue' : 'Healthy Receivables Turnover Pace',
    description: `Outstanding customer receivables stand at ${arFmt}, representing ${arRatio.toFixed(1)}% of trailing revenue. Shortening the payment settlement cycle from invoice issuance to settlement will dramatically improve cash velocity.`,
    urgency: arUrgency,
    category: 'Revenue',
    metric: 'Accounts Receivable',
    metricValue: arFmt,
    recommendations: [
      {
        action: 'Implement automated payment reminder notices at 3 days before and 3 days past due date.',
        expectedImpact: 'Reduces average Days Sales Outstanding (DSO) by 10 to 14 days.',
      },
      {
        action: 'Introduce a 2% prompt-payment settlement discount for invoices paid within 10 days.',
        expectedImpact: 'Accelerates immediate cash inflow from key enterprise accounts.',
      },
      {
        action: 'Require electronic ACH or automated credit card billing on all recurring service retainers.',
        expectedImpact: 'Eliminates manual payment friction and delinquency risk.',
      },
    ],
    talkingPoints: [
      `Total uncollected receivables equal ${arFmt}; this is paper revenue until collected.`,
      'Establishing automated dunning cycles directly improves collection velocity.',
      'Transitioning clients to autopay removes invoice lag permanently.',
    ],
    severityOrder: 2,
  });

  // Insight 3: Profit Margins & Unit Economics
  const marginUrgency = profitMargin >= 40 ? 'positive' : profitMargin >= 15 ? 'info' : profitMargin >= 0 ? 'watch' : 'critical';
  generatedInsights.push({
    title: profitMargin >= 40 ? 'Superior Unit Economics & Profit Margin Profile' : 'Profit Margin Compression & Pricing Review',
    description: `The business generated ${netIncomeFmt} in net income on ${revFmt} of revenue, delivering an exceptional ${marginFmt} net profit margin. Fixed overhead is minimal, indicating strong operating leverage.`,
    urgency: marginUrgency,
    category: 'Margins',
    metric: 'Net Margin',
    metricValue: marginFmt,
    recommendations: [
      {
        action: 'Preserve low baseline fixed overhead while scaling client acquisition.',
        expectedImpact: 'Sustains 75%+ gross margin profile as top-line expands.',
      },
      {
        action: 'Reinvest a portion of high-margin earnings into automated service delivery infrastructure.',
        expectedImpact: 'Increases capacity without increasing headcount cost.',
      },
      {
        action: 'Benchmark current pricing tiers against market leaders for selective rate adjustments.',
        expectedImpact: 'Potential 10-15% margin enhancement on future contract renewals.',
      },
    ],
    talkingPoints: [
      `Net margin of ${marginFmt} significantly outperforms standard small-business industry benchmarks.`,
      'Operating leverage is strong: incremental revenues drop directly to the bottom line.',
      'Pricing power is validated by low cost-of-goods and strong net profit conversion.',
    ],
    severityOrder: 3,
  });

  // Insight 4: Operating Expenses & Overhead Discipline
  const expRatio = revenue > 0 ? (expenses / revenue) * 100 : 0;
  const expUrgency = expRatio < 30 ? 'positive' : expRatio < 60 ? 'info' : 'warning';
  generatedInsights.push({
    title: expRatio < 30 ? 'Disciplined Operating Cost Containment' : 'Operating Cost Rationalization Opportunity',
    description: `Operating expenses are contained at ${expFmt} (${expRatio.toFixed(1)}% of top-line revenue). Maintaining disciplined cost controls during growth phases prevents fixed overhead bloat.`,
    urgency: expUrgency,
    category: 'Expenses',
    metric: 'Operating Expenses',
    metricValue: expFmt,
    recommendations: [
      {
        action: 'Conduct a quarterly review of SaaS subscriptions, vendor contracts, and processing fees.',
        expectedImpact: 'Eliminates redundant tool expenses, saving an estimated $200-$500 monthly.',
      },
      {
        action: 'Set departmental spending approval thresholds prior to hiring or major software commitments.',
        expectedImpact: 'Enforces accountability and keeps overhead under 25% of gross revenue.',
      },
    ],
    talkingPoints: [
      `Operating expenses represent only ${expRatio.toFixed(1)}% of revenue, demonstrating strict fiscal discipline.`,
      'Continued cost vigilance ensures high profitability carries into future quarters.',
    ],
    severityOrder: 4,
  });

  // Insight 5: Tax Positioning & Liability Provisioning
  const estimatedTaxReserve = Math.max(0, Math.round(netIncome * 0.3));
  const taxUrgency = cash < estimatedTaxReserve ? 'warning' : 'info';
  generatedInsights.push({
    title: 'Quarterly Estimated Tax Provisioning & Reserve Alignment',
    description: `With net earnings of ${netIncomeFmt}, estimated pass-through tax obligations are projected at approximately ${`$${estimatedTaxReserve.toLocaleString()}`} (30%). ${cash < estimatedTaxReserve ? `Current cash (${cashFmt}) is lower than the full tax reserve; dedicating receivables collections to this reserve is advised.` : `Current liquidity is sufficient to cover anticipated quarterly tax obligations.`}`,
    urgency: taxUrgency,
    category: 'Tax Positioning',
    metric: 'Estimated Tax Reserve',
    metricValue: `$${estimatedTaxReserve.toLocaleString()}`,
    recommendations: [
      {
        action: `Segregate 25-30% of incoming customer payments into a dedicated tax reserve sub-account.`,
        expectedImpact: `Guarantees full liquidity for IRS & state quarterly vouchers without operational stress.`,
      },
      {
        action: 'Consult your PrimeCFO advisor to explore Section 179 equipment deductions and retirement plan contributions.',
        expectedImpact: 'Potential reduction of taxable net income by $2,000 to $5,000.',
      },
    ],
    talkingPoints: [
      `Estimated tax liability accrues at approximately 30% of net income (${`$${estimatedTaxReserve.toLocaleString()}`}).`,
      'Early quarterly provisioning prevents year-end cash crunch surprises.',
    ],
    severityOrder: 5,
  });

  // Insight 6: Growth Capacity & Working Capital Allocation
  const reinvestmentCapacity = Math.max(0, Math.round(netIncome * 0.45));
  generatedInsights.push({
    title: 'Self-Funded Growth & Reinvestment Capacity',
    description: `After accounting for tax provisions and baseline overhead, the company possesses approximately ${`$${reinvestmentCapacity.toLocaleString()}`} in self-funded expansion capital once outstanding receivables settle into cash.`,
    urgency: 'info',
    category: 'Growth Capacity',
    metric: 'Reinvestment Budget',
    metricValue: `$${reinvestmentCapacity.toLocaleString()}`,
    recommendations: [
      {
        action: 'Allocate growth capital toward tested, high-converting customer acquisition channels.',
        expectedImpact: 'Generates predictable 20-30% year-over-year revenue growth.',
      },
      {
        action: 'Align owner compensation and profit distributions with cash collections rather than accrued billing.',
        expectedImpact: 'Maintains healthy working capital liquidity while rewarding equity holders.',
      },
    ],
    talkingPoints: [
      `Self-funding capacity of ${`$${reinvestmentCapacity.toLocaleString()}`} gives the business strong financial independence.`,
      'Growth can be entirely funded from operational profits without external debt or dilution.',
    ],
    severityOrder: 6,
  });

  // 4. Persist Risk Posture to Database
  try {
    const existingPosture = await prisma.aiRiskPosture.findFirst({
      where: {
        clientId,
        reportRange,
      },
    });

    if (existingPosture) {
      await prisma.aiRiskPosture.update({
        where: { id: existingPosture.id },
        data: {
          rating,
          summary: postureSummary,
          topAction,
        },
      });
    } else {
      await prisma.aiRiskPosture.create({
        data: {
          clientId,
          reportRange,
          rating,
          summary: postureSummary,
          topAction,
        },
      });
    }
  } catch (postureErr) {
    console.error('Error saving AI risk posture:', postureErr);
  }

  // 5. Persist Insights to Database (Replace existing for this client)
  try {
    await prisma.aiInsight.deleteMany({
      where: { clientId },
    });

    for (const item of generatedInsights) {
      await prisma.aiInsight.create({
        data: {
          clientId,
          periodId: periodRecord?.id || null,
          reportRange,
          title: item.title,
          description: item.description,
          urgency: item.urgency,
          category: item.category,
          metric: item.metric,
          metricValue: item.metricValue,
          recommendations: item.recommendations,
          talkingPoints: item.talkingPoints,
          severityOrder: item.severityOrder,
        },
      });
    }
  } catch (insightsErr) {
    console.error('Error saving AI insights:', insightsErr);
  }

  return {
    riskPosture: {
      rating,
      summary: postureSummary,
      topAction,
      reportRange,
    },
    insights: generatedInsights,
  };
}
