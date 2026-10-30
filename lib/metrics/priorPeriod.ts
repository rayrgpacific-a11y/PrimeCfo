/**
 * Prior-period coverage guards for period-over-period insights.
 * Empty or thin prior windows produce absurd growth % (e.g. +1246%).
 */

export const MIN_PRIOR_COVERAGE = 0.8;
export const MIN_PRIOR_BASE = 1000;

export type PriorPeriodStats = {
  monthsWithData: number;
  monthCount: number;
  /** Absolute prior-period total used as the growth denominator (e.g. revenue). */
  total: number;
};

export function priorPeriodIsSufficient(
  prior: PriorPeriodStats | null | undefined,
  opts?: { minCoverage?: number; minBase?: number }
): boolean {
  if (!prior || prior.monthCount <= 0) return false;
  const minCoverage = opts?.minCoverage ?? MIN_PRIOR_COVERAGE;
  const minBase = opts?.minBase ?? MIN_PRIOR_BASE;
  const coverage = prior.monthsWithData / prior.monthCount;
  if (coverage < minCoverage) return false;
  if (Math.abs(prior.total) < minBase) return false;
  return true;
}

/** Count months in a window with material activity (revenue or costs). */
export function countMonthsWithData(
  activities: number[],
  materiality = 1
): { monthsWithData: number; monthCount: number } {
  const monthCount = activities.length;
  const monthsWithData = activities.filter((a) => Math.abs(a) >= materiality).length;
  return { monthsWithData, monthCount };
}
