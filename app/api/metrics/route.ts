import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenantSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientIdParam = searchParams.get('clientId');
    const period = searchParams.get('period') || '30d';

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
          period,
        },
      });
    }

    // Match exact period or fetch the most recent real QuickBooks synchronized metric for this client
    let metricRecord = await prisma.financialMetric.findFirst({
      where: { clientId: targetClientId, period },
      orderBy: { createdAt: 'desc' },
    });

    if (!metricRecord) {
      metricRecord = await prisma.financialMetric.findFirst({
        where: { clientId: targetClientId },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (metricRecord) {
      return NextResponse.json({
        success: true,
        data: metricRecord,
      });
    }

    // Clean zero-state when no metrics exist yet - ZERO mock numbers
    return NextResponse.json({
      success: true,
      data: {
        clientId: targetClientId,
        cashPosition: 0,
        revenue: 0,
        netProfit: 0,
        profitMargin: 0,
        arAging: 0,
        cashRunway: 0,
        period,
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
    const { clientId, cashPosition, revenue, netProfit, profitMargin, arAging, cashRunway, period } = body;

    const authResult = await requireTenantSession(clientId);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const metric = await prisma.financialMetric.create({
      data: {
        clientId,
        period: period || '30d',
        cashPosition: parseFloat(cashPosition) || 0,
        revenue: parseFloat(revenue) || 0,
        netProfit: parseFloat(netProfit) || 0,
        profitMargin: parseFloat(profitMargin) || 0,
        arAging: parseFloat(arAging) || 0,
        cashRunway: parseFloat(cashRunway) || 0,
      },
    });

    return NextResponse.json({ success: true, data: metric });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save metric' },
      { status: 500 }
    );
  }
}
