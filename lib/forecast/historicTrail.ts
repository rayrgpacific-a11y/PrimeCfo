import { addDays, parseISO, startOfDay } from 'date-fns';
import type { ChartDataPoint } from '@/lib/financialData';

export type HistoricCashPoint = {
  /** UTC midnight ms — proportional placement on the time axis */
  ts: number;
  /** ISO date YYYY-MM-DD */
  date: string;
  cash: number;
};

/**
 * 14-day cash trail bridging prior trend month to today's bank balance
 * (history left of Today on the outlook chart).
 */
export function buildHistoricCashTrail14d(
  trends: ChartDataPoint[],
  bankToday: number,
  asOf?: string
): HistoricCashPoint[] {
  if (!Number.isFinite(bankToday)) bankToday = 0;

  const today = startOfDay(asOf ? parseISO(asOf) : new Date());
  const last = trends.length ? trends[trends.length - 1]! : null;
  const prev = trends.length >= 2 ? trends[trends.length - 2]!.cash : (last?.cash ?? bankToday);

  return Array.from({ length: 15 }, (_, i) => {
    const day = addDays(today, i - 14);
    const t = i / 14;
    const cash = prev * (1 - t) + bankToday * t;
    return {
      ts: day.getTime(),
      date: day.toISOString().slice(0, 10),
      cash,
    };
  });
}
