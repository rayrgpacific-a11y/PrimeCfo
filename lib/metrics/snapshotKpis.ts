/**

 * Map persisted metrics snapshots to Analytics KPI shape — no local ratio math.

 */

import type { MetricsSnapshotPayload } from '@/lib/metrics/computeMetrics';

import type { AnalyticsKpis } from '@/lib/metrics/ratios';

import { formatRunwayDisplay } from '@/lib/metrics/runwayDisplay';



export type SnapshotKpis = AnalyticsKpis & {

  cashFlowPositive: boolean;

  netCashFlowMonthly: number | null;

  monthlyOutflows: number | null;

  periodCount: number;

};



export function snapshotToAnalyticsKpis(m: MetricsSnapshotPayload): SnapshotKpis {

  const runway = formatRunwayDisplay({

    cashFlowPositive: m.cashFlowPositive,

    netCashFlowMonthly: m.netCashFlowMonthly,

    runwayMonths: m.runwayMonths,

  });



  return {

    grossMargin: m.grossMargin,

    netMargin: m.netMargin,

    currentRatio: m.currentRatio,

    quickRatio: m.quickRatio,

    dso: m.dso,

    dpo: m.dpo,

    dsoNote: m.dsoNote,

    dpoNote: m.dpoNote,

    burnRate: runway.cashFlowPositive

      ? null

      : m.netCashFlowMonthly != null && m.netCashFlowMonthly < 0

        ? Math.round(Math.abs(m.netCashFlowMonthly))

        : null,

    runway: runway.cashFlowPositive ? null : m.runwayMonths,

    cashFlowPositive: m.cashFlowPositive,

    netCashFlowMonthly: m.netCashFlowMonthly,

    monthlyOutflows: m.monthlyOutflows,

    periodCount: m.periodCount,

  };

}

