import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenantSession } from '@/lib/auth';

const VALID_ALERT_KINDS = ['cash_balance', 'cash_crunch', 'ar_spike', 'revenue_trend', 'expense_anomaly', 'margin_erode'] as const;

function normalizeAlertKind(kind?: string): string {
  const k = (kind || '').toLowerCase().trim();
  if (k.includes('crunch') || k.includes('runway')) return 'cash_crunch';
  if (k.includes('cash') || k.includes('liquid') || k.includes('horizon')) return 'cash_balance';
  if (k.includes('ar') || k.includes('receiv') || k.includes('invoice')) return 'ar_spike';
  if (k.includes('rev') || k.includes('sales')) return 'revenue_trend';
  if (k.includes('exp') || k.includes('cost') || k.includes('burn')) return 'expense_anomaly';
  if (k.includes('margin') || k.includes('profit')) return 'margin_erode';
  return 'cash_balance';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    const authResult = await requireTenantSession(clientId || undefined);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { session } = authResult;
    const targetClientId = session.role === 'operator' ? (clientId || session.clientId) : session.clientId;

    if (!targetClientId) {
      return NextResponse.json({ success: true, data: [] });
    }

    // 1. Fetch from authentic financial_alert_events table
    const alertEvents = await prisma.financialAlert.findMany({
      where: { clientId: targetClientId },
      orderBy: { createdAt: 'desc' },
    }); 

    let formattedAlerts = alertEvents.map((a: any) => ({
      id: a.id,
      clientId: a.clientId,
      title: a.title,
      description: a.body ?? a.description ?? '',
      severity: a.severityKey ?? a.severity ?? 'warning',
      category: a.alertKind ?? a.category ?? 'Financial Health',
      actionRequired: Boolean((a.meta as any)?.actionRequired ?? a.actionRequired),
      isResolved: a.state === 'resolved' || Boolean(a.isResolved),
      timestamp: a.createdAt ?? a.timestamp ?? new Date(),
    }));

    // 2. If client has no manual alert events, synthesize from real ai_insights
    if (formattedAlerts.length === 0) {
      const insights = await prisma.aiInsight.findMany({
        where: { clientId: targetClientId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      if (insights.length > 0) {
        formattedAlerts = insights.map((ins) => ({
          id: ins.id,
          clientId: ins.clientId,
          title: ins.title,
          description: ins.description,
          severity: ins.urgency === 'critical' ? 'critical' : ins.urgency === 'warning' ? 'warning' : 'info',
          category: ins.category || 'AI Analysis',
          actionRequired: ins.urgency === 'critical' || ins.urgency === 'warning',
          isResolved: false,
          timestamp: ins.createdAt,
        }));
      }
    }

    return NextResponse.json({ success: true, data: formattedAlerts });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Database error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientId, title, description, severity, category, actionRequired } = body;

    const authResult = await requireTenantSession(clientId);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { session } = authResult;
    const targetClientId = session.role === 'operator' ? (clientId || session.clientId) : session.clientId;

    if (!targetClientId) {
      return NextResponse.json({ error: 'Valid client ID required' }, { status: 400 });
    }

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Alert title is required' }, { status: 400 });
    }

    const validKind = normalizeAlertKind(category);

    const existingAlert = await prisma.financialAlert.findFirst({
      where: {
        clientId: targetClientId,
        alertKind: validKind,
      },
    });

    const alertEvent = existingAlert
      ? await prisma.financialAlert.update({
          where: { id: existingAlert.id },
          data: {
            title: title.trim(),
            body: description ? description.trim() : '',
            severityKey: severity || 'warning',
            state: 'active',
            meta: { actionRequired: !!actionRequired },
          },
        })
      : await prisma.financialAlert.create({
          data: {
            clientId: targetClientId,
            title: title.trim(),
            body: description ? description.trim() : '',
            severityKey: severity || 'warning',
            alertKind: validKind,
            state: 'active',
            meta: { actionRequired: !!actionRequired },
          },
        });

    const created: any = alertEvent;
    return NextResponse.json({
      success: true,
      data: {
        id: created.id,
        clientId: created.clientId,
        title: created.title,
        description: created.body ?? created.description ?? '',
        severity: created.severityKey ?? created.severity ?? 'warning',
        category: created.alertKind ?? created.category ?? 'Cash Horizon',
        actionRequired: !!actionRequired,
        isResolved: false,
        timestamp: created.createdAt ?? created.timestamp ?? new Date(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create alert' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, isResolved, clientId, resolveAll } = body;

    const authResult = await requireTenantSession(clientId || undefined);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { session } = authResult;

    if (resolveAll) {
      const targetClientId = session.role === 'operator' ? (clientId || session.clientId) : session.clientId;
      if (!targetClientId) {
        return NextResponse.json({ error: 'Client ID required' }, { status: 400 });
      }
      await prisma.financialAlert.updateMany({
        where: { clientId: targetClientId, state: 'active' },
        data: { state: 'resolved' },
      });
      return NextResponse.json({ success: true, message: 'All alerts resolved' });
    }

    if (!id) {
      return NextResponse.json({ error: 'Alert ID or resolveAll required' }, { status: 400 });
    }

    // Tenant Scoping Guard: Prevent IDOR across tenants
    const existingAlert = await prisma.financialAlert.findUnique({ where: { id } });
    if (!existingAlert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    if (session.role !== 'operator' && existingAlert.clientId !== session.clientId) {
      return NextResponse.json(
        { error: 'Forbidden: Access to this alert is denied' },
        { status: 403 }
      );
    }

    const updated = await prisma.financialAlert.update({
      where: { id },
      data: { state: isResolved ?? true ? 'resolved' : 'active' },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        isResolved: updated.state === 'resolved',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update alert' },
      { status: 500 }
    );
  }
}
   