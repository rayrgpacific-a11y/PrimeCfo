/**
 * Single monthly net cash flow definition for metrics snapshots.
 * Uses CF statement period columns aligned to the synced window — not nominal range months.
 */
import { extractNetCashIncreaseTotal } from '@/lib/ai/extractReportExtras';
import { extractCashFlowNetByPeriod } from '@/lib/metrics/parseQboReport';
import { median } from '@/lib/dataQuality/utils';

export type MonthlyNetCashResult = {
  netCashFlowMonthly: number | null;
  cashFlowPositive: boolean;
  /** Period columns used (matches synced window when possible). */
  periodCount: number;
  /** Raw monthly values from CF columns. */
  monthlyValues: number[];
};

/**
 * Resolve average monthly net cash from a CF report for the active window.
 * Prefers median of period columns; falls back to total ÷ actual period count.
 */
export function resolveMonthlyNetCash(
  cashFlowRaw: unknown,
  windowPeriodCount: number
): MonthlyNetCashResult {
  const periodCount = Math.max(1, windowPeriodCount);
  const monthlyValues = extractCashFlowNetByPeriod(cashFlowRaw).filter((n) =>
    Number.isFinite(n)
  );

  let netCashFlowMonthly: number | null = null;

  if (monthlyValues.length >= 2) {
    const aligned =
      monthlyValues.length > periodCount
        ? monthlyValues.slice(-periodCount)
        : monthlyValues;
    netCashFlowMonthly = median(aligned);
  } else if (monthlyValues.length === 1) {
    netCashFlowMonthly = monthlyValues[0]!;
  } else {
    const totalNet = extractNetCashIncreaseTotal(cashFlowRaw);
    if (totalNet != null && Number.isFinite(totalNet)) {
      netCashFlowMonthly = totalNet / periodCount;
    }
  }

  if (netCashFlowMonthly != null) {
    netCashFlowMonthly = Math.round(netCashFlowMonthly * 100) / 100;
  }

  const cashFlowPositive = netCashFlowMonthly != null && netCashFlowMonthly >= 0;

  return {
    netCashFlowMonthly,
    cashFlowPositive,
    periodCount,
    monthlyValues,
  };
}
