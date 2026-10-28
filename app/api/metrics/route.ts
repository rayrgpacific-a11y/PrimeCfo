import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenantSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientIdParam = searchParams.get('clientId');
    const period = searchParams.get('period') || '3m';

    const authResult = await requireTenantSession(clientIdParam || undefined);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { session } = authResult;
    let targetClientId = session.role === 'operator' ? (clientIdParam || session.clientId) : session.clientId;

    if (!targetClientId && session.role === 'operator') {
      const primaryClient = await prisma.client.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      });
      targetClientId = primaryClient?.id;
    }

    if (!targetClientId) {
      return NextResponse.json({
        success: true,
        data: {
          clientId: null,
          cashPosition: 0,
          revenue: 0,
          netProfit: 0,
          profitMargin: 0,
          arAging: 0,
          cashRunway: 0,
          monthlyTrajectory: [],
          trends: {},
          reportingBasis: 'Cash',
          period,
        },
      });
    }

    // 1. Fetch Client profile for reporting basis
    const clientRecord = await prisma.client.findUnique({
      where: { id: targetClientId },
      select: {
        reportingBasisOverride: true,
        qboReportBasis: true,
        clientName: true,
        companyName: true,
      },
    });

    const reportingBasis =
      clientRecord?.reportingBasisOverride || clientRecord?.qboReportBasis || 'Cash';

    // 2. Query real accounting metrics from authentic financial_metrics table
    const metrics = await prisma.financialMetric.findMany({
      where: { clientId: targetClientId },
      include: { period: true },
      orderBy: { createdAt: 'desc' },
    });

    let revenue = 0;
    let cashPosition = 0;
    let netProfit = 0;
    let profitMargin = 0;
    let arAging = 0;
    let expenses = 0;

    if (metrics.length > 0) {
      const getVal = (key: string): number => {
        const found = metrics.find((m) => m.metricKey === key);
        return found ? Number(found.value) : 0;
      };

      revenue = getVal('revenue');
      cashPosition = getVal('cash');
      netProfit = getVal('net_income');
      profitMargin = getVal('profit_margin_pct');
      arAging = getVal('accounts_receivable');
      expenses = getVal('expenses');
    }

    // 3. Query authentic financial_reports (pnl and balance_sheet) strictly for THIS tenant
    let pnlReport = await prisma.financialReport.findFirst({
      where: {
        clientId: targetClientId,
        reportType: 'pnl',
        rawJson: {
          path: ['Header', 'SummarizeColumnsBy'],
          equals: 'Month',
        },
      },
      orderBy: { syncedAt: 'desc' },
    });

    if (!pnlReport) {
      pnlReport = await prisma.financialReport.findFirst({
        where: { clientId: targetClientId, reportType: 'pnl' },
        orderBy: { syncedAt: 'desc' },
      });
    }

    const bsReport = await prisma.financialReport.findFirst({
      where: { clientId: targetClientId, reportType: 'balance_sheet' },
      orderBy: { syncedAt: 'desc' },
    });

    // Extract real monthly trajectory points from authentic P&L rawJson
    const monthlyTrajectory: Array<{
      label: string;
      revenue: number;
      netIncome: number;
      expenses: number;
    }> = [];

    if (pnlReport && pnlReport.rawJson) {
      const rj = pnlReport.rawJson as any;
      const cols: any[] = rj.Columns?.Column || [];
      const rows: any[] = rj.Rows?.Row || [];

      const incomeRow = rows.find(
        (r: any) => r.group === 'Income' || r.Header?.ColData?.[0]?.value === 'Income'
      );
      const netIncomeRow = rows.find(
        (r: any) =>
          r.group === 'NetIncome' ||
          r.Summary?.ColData?.[0]?.value === 'Net Income' ||
          r.group === 'NetOperatingIncome'
      );
      const expensesRow = rows.find(
        (r: any) =>
          r.group === 'Expenses' ||
          r.Summary?.ColData?.[0]?.value === 'Total Expenses'
      );

      for (let i = 1; i < cols.length; i++) {
        const colTitle = cols[i]?.ColTitle;
        if (!colTitle || colTitle.toLowerCase() === 'total') continue;

        const rev = parseFloat(incomeRow?.Summary?.ColData?.[i]?.value || '0') || 0;
        const net = parseFloat(netIncomeRow?.Summary?.ColData?.[i]?.value || '0') || 0;
        const exp = parseFloat(expensesRow?.Summary?.ColData?.[i]?.value || '0') || 0;

        monthlyTrajectory.push({
          label: colTitle,
          revenue: Math.round(rev),
          netIncome: Math.round(net),
          expenses: Math.round(exp),
        });
      }

      // If financial_metrics was empty, hydrate primary metrics from authentic P&L total/latest
      if (revenue === 0 && incomeRow?.Summary?.ColData) {
        const lastCol = incomeRow.Summary.ColData[incomeRow.Summary.ColData.length - 1]?.value;
        revenue = parseFloat(lastCol || '0') || 0;
      }
      if (netProfit === 0 && netIncomeRow?.Summary?.ColData) {
        const lastCol = netIncomeRow.Summary.ColData[netIncomeRow.Summary.ColData.length - 1]?.value;
        netProfit = parseFloat(lastCol || '0') || 0;
      }
      if (revenue > 0 && profitMargin === 0) {
        profitMargin = parseFloat(((netProfit / revenue) * 100).toFixed(1));
      }
    }

    // Hydrate cash and AR from balance sheet if metrics was empty
    if (bsReport && bsReport.rawJson) {
      const rj = bsReport.rawJson as any;
      const rows: any[] = rj.Rows?.Row || [];
      const assetsRow = rows.find((r: any) => r.group === 'TotalAssets');
      const assetSubRows: any[] = assetsRow?.Rows?.Row || [];

      // Find Bank accounts / cash equivalents
      if (cashPosition === 0) {
        const bankSection = assetSubRows.find((r: any) =>
          (r.Header?.ColData?.[0]?.value || '').toLowerCase().includes('bank')
        );
        const bankSum = bankSection?.Summary?.ColData;
        if (bankSum && bankSum.length > 1) {
          cashPosition = parseFloat(bankSum[bankSum.length - 1]?.value || '0') || 0;
        }
      }

      // Find Accounts Receivable
      if (arAging === 0) {
        const arSection = assetSubRows.find((r: any) =>
          (r.Header?.ColData?.[0]?.value || '').toLowerCase().includes('receivable')
        );
        const arSum = arSection?.Summary?.ColData || arSection?.ColData;
        if (arSum && arSum.length > 1) {
          arAging = parseFloat(arSum[arSum.length - 1]?.value || '0') || 0;
        }
      }
    }

    const burnRate = expenses > 0 ? expenses / 3 : (revenue > netProfit ? (revenue - netProfit) / 3 : 0);
    const cashRunway = burnRate > 0 && cashPosition > 0 ? parseFloat((cashPosition / burnRate).toFixed(1)) : 0;

    // Calculate real month-over-month trend percentages from authentic monthly trajectory
    let revenueTrendPct: number | null = null;
    let netProfitTrendPct: number | null = null;

    if (monthlyTrajectory.length >= 2) {
      // Find the last two non-zero months
      const nonZeroMonths = monthlyTrajectory.filter((m) => m.revenue > 0);
      if (nonZeroMonths.length >= 2) {
        const last = nonZeroMonths[nonZeroMonths.length - 1];
        const prev = nonZeroMonths[nonZeroMonths.length - 2];
        if (prev.revenue > 0) {
          revenueTrendPct = parseFloat((((last.revenue - prev.revenue) / prev.revenue) * 100).toFixed(1));
        }
        if (Math.abs(prev.netIncome) > 0) {
          netProfitTrendPct = parseFloat((((last.netIncome - prev.netIncome) / Math.abs(prev.netIncome)) * 100).toFixed(1));
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        clientId: targetClientId,
        cashPosition,
        revenue,
        netProfit,
        profitMargin,
        arAging,
        cashRunway,
        period,
        reportingBasis,
        monthlyTrajectory,
        trends: {
          revenuePct: revenueTrendPct,
          netProfitPct: netProfitTrendPct,
        },
      },
    });
  } catch (error) {
    console.error('Fetch metrics error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Database error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientId, cashPosition, revenue, netProfit, profitMargin, arAging, period } = body;

    const authResult = await requireTenantSession(clientId);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { session } = authResult;
    const targetClientId = session.role === 'operator' ? (clientId || session.clientId) : session.clientId;

    if (!targetClientId) {
      return NextResponse.json({ error: 'Valid client ID required' }, { status: 400 });
    }

    let reportPeriod = await prisma.financialReportPeriod.findFirst({
      where: { clientId: targetClientId },
      orderBy: { endDate: 'desc' },
    });

    if (!reportPeriod) {
      const normalizedType = period && String(period).toLowerCase().includes('q') ? 'quarter' : 'month';
      reportPeriod = await prisma.financialReportPeriod.create({
        data: {
          clientId: targetClientId,
          periodType: normalizedType,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          label: period || 'Last 30 Days',
        },
      });
    }

    const metricPairs = [
      { key: 'cash', val: parseFloat(cashPosition) || 0, unit: 'currency' },
      { key: 'revenue', val: parseFloat(revenue) || 0, unit: 'currency' },
      { key: 'net_income', val: parseFloat(netProfit) || 0, unit: 'currency' },
      { key: 'profit_margin_pct', val: parseFloat(profitMargin) || 0, unit: 'ratio' },
      { key: 'accounts_receivable', val: parseFloat(arAging) || 0, unit: 'currency' },
    ];

    for (const pair of metricPairs) {
      await prisma.financialMetric.create({
        data: {
          clientId: targetClientId,
          periodId: reportPeriod.id,
          metricKey: pair.key,
          value: pair.val,
          unit: pair.unit,
        },
      });
    }

    return NextResponse.json({ success: true, message: 'Metrics synchronized to database' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save metric' },
      { status: 500 }
    );
  }
}
