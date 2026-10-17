import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenantSession } from '@/lib/auth';

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

    const alerts = await prisma.financialAlert.findMany({
      where: { clientId: targetClientId },
      orderBy: { timestamp: 'desc' },
    });

    return NextResponse.json({ success: true, data: alerts });
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

    const alert = await prisma.financialAlert.create({
      data: {
        clientId,
        title,
        description,
        severity: severity || 'warning',
        category: category || 'Cash Horizon',
        actionRequired: !!actionRequired,
      },
    });

    return NextResponse.json({ success: true, data: alert });
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
    const { id, isResolved } = body;

    const authResult = await requireTenantSession();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const updated = await prisma.financialAlert.update({
      where: { id },
      data: { isResolved: isResolved ?? true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update alert' },
      { status: 500 }
    );
  }
}
