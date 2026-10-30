/** Internal runway math may cap at 120 months — never show that literal in the UI. */
export const RUNWAY_MATH_CAP_MONTHS = 120;

export type RunwayDisplay = {
  headline: string;
  context: string;
  cashFlowPositive: boolean;
};

function fmtMoney(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.abs(n));
}

/**
 * One display rule for dashboard, Analytics, Treasury, and insights.
 */
export function formatRunwayDisplay(opts: {
  cashFlowPositive: boolean;
  netCashFlowMonthly: number | null;
  runwayMonths: number | null;
  cash?: number;
}): RunwayDisplay {
  const net = opts.netCashFlowMonthly;
  const positive = opts.cashFlowPositive || (net != null && net >= 0);

  if (positive) {
    const netLabel =
      net != null && net > 0
        ? `Cash-flow positive — +${fmtMoney(net)}/mo`
        : 'Cash-flow positive — no runway constraint';
    return {
      headline: 'Cash-flow positive',
      context: netLabel,
      cashFlowPositive: true,
    };
  }

  const burn = net != null && net < 0 ? Math.abs(net) : null;
  const months = opts.runwayMonths;

  if (months == null || burn == null || burn <= 0) {
    return {
      headline: '—',
      context: 'Sync Cash Flow Statement for runway',
      cashFlowPositive: false,
    };
  }

  const monthsLabel =
    months >= RUNWAY_MATH_CAP_MONTHS
      ? '10+ years'
      : `${months.toFixed(1)} mo`;

  return {
    headline: monthsLabel,
    context: `${monthsLabel} at net burn ${fmtMoney(burn)}/mo`,
    cashFlowPositive: false,
  };
}
