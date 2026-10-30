import { NextRequest, NextResponse } from 'next/server';

import { guardClientAccess } from '@/lib/auth/clientAccess';

import { loadClientMetrics } from '@/lib/metrics/loadClientMetrics';

import { validatePeriodTotals } from '@/lib/metrics/validateTrends';

import { loadClientBasisSettings } from '@/lib/qbo/clientBasis';

import { getLatestMetricsSnapshot, buildMetricsSnapshot } from '@/lib/metrics/snapshot';

import { snapshotToAnalyticsKpis } from '@/lib/metrics/snapshotKpis';

import type { ReportRange } from '@/lib/qbo/reports';



/**

 * GET /api/analytics?clientId=xxx&range=3m

 * Live KPIs + monthly revenue/cost trends from persisted metrics snapshot.

 */

export async function GET(request: NextRequest) {

  const clientId = request.nextUrl.searchParams.get('clientId');

  const range = (request.nextUrl.searchParams.get('range') ?? '3m') as ReportRange;

  const access = await guardClientAccess(clientId);

  if (!access.ok) return access.response;



  const [bundle, snapshotRow, basis] = await Promise.all([

    loadClientMetrics(access.clientId, range),

    getLatestMetricsSnapshot(access.clientId, range),

    loadClientBasisSettings(access.clientId),

  ]);



  if (!bundle.hasData) {

    return NextResponse.json({

      hasData: false,

      error: 'No analytics data. Connect QuickBooks and run Sync.',

      kpis: null,

      trends: [],

      periodTotals: null,

      validation: null,

      snapshotId: null,

    });

  }



  let metrics = snapshotRow?.metrics ?? null;

  let snapshotId = snapshotRow?.id ?? null;

  if (!metrics) {

    metrics = await buildMetricsSnapshot(access.clientId, range);

  }



  const windowTrends = bundle.windowTrends;

  const kpisFromSnapshot = metrics ? snapshotToAnalyticsKpis(metrics) : null;



  const gatedKpis = bundle.currentPeriodIncomplete && kpisFromSnapshot

    ? {

        ...kpisFromSnapshot,

        grossMargin: null,

        netMargin: null,

        currentRatio: null,

        quickRatio: null,

        dso: null,

        dpo: null,

        dsoNote: 'Pending reconciliation — sync your books to see this metric',

        dpoNote: 'Pending reconciliation — sync your books to see this metric',

      }

    : kpisFromSnapshot;



  const chartTrends = windowTrends

    .filter((t) => t.revenue > 0 || t.expenses > 0)

    .map((t) => ({

      month: formatMonthLabel(t.periodLabel),

      revenue: t.revenue,

      expenses: t.expenses,

      netIncome: t.profit,

    }));



  const totalRevenue = windowTrends.reduce((s, t) => s + t.revenue, 0);

  const totalCosts = windowTrends.reduce((s, t) => s + t.expenses, 0);

  const totalNetIncome = windowTrends.reduce((s, t) => s + t.profit, 0);

  const validation = validatePeriodTotals(windowTrends);



  return NextResponse.json({

    hasData: true,

    kpis: gatedKpis,

    trends: chartTrends,

    periodTotals: {

      totalRevenue,

      totalCosts,

      totalNetIncome,

      periodCount: validation.periodCount,

    },

    validation,

    dataError: bundle.summary?.data_error ?? false,

    currentPeriodIncomplete: bundle.currentPeriodIncomplete,

    displayBasis: basis.displayBasis,

    snapshotId,

    periodCount: gatedKpis?.periodCount ?? windowTrends.length,

  });

}



function formatMonthLabel(label: string): string {

  const m = label.match(/^(\d{4})-(\d{2})$/);

  if (m) {

    const d = new Date(Number(m[1]), Number(m[2]) - 1, 1);

    return d.toLocaleDateString('en-US', { month: 'short' });

  }

  return label;

}

