import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenantSession, requireOperatorSession } from '@/lib/auth';

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

    // 1. Sourced from authentic ai_risk_posture table
    const postures = await prisma.aiRiskPosture.findMany({
      where: { clientId: targetClientId },
      orderBy: { createdAt: 'desc' },
    });

    const actionItems: any[] = [];

    for (const p of postures) {
      if (p.topAction) {
        actionItems.push({
          id: p.id,
          clientId: targetClientId,
          title: p.topAction,
          description: p.summary,
          priority: p.rating === 'HIGH' ? 'high' : 'normal',
          isCompleted: false,
          dueDate: null,
          createdAt: p.createdAt,
        });
      }
    }

    // 2. Sourced from authentic ai_insights recommendations
    const insights = await prisma.aiInsight.findMany({
      where: { clientId: targetClientId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    for (const ins of insights) {
      if (Array.isArray(ins.recommendations)) {
        ins.recommendations.forEach((rec: any, idx: number) => {
          if (rec && typeof rec.action === 'string' && rec.action.trim()) {
            actionItems.push({
              id: `${ins.id}-${idx}`,
              clientId: targetClientId,
              title: rec.action,
              description: rec.expectedImpact || ins.title,
              priority: ins.urgency === 'critical' ? 'high' : 'normal',
              isCompleted: false,
              dueDate: null,
              createdAt: ins.createdAt,
            });
          }
        });
      }
    }

    return NextResponse.json({ success: true, data: actionItems });
  } catch (error) {
    console.error('Error fetching action items from authentic AI tables:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Database error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireOperatorSession();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { clientId, title, description, priority, dueDate, isCompleted } = body;

    if (!clientId || !title) {
      return NextResponse.json(
        { error: 'Client ID and title are required' },
        { status: 400 }
      );
    }

    // Persist into authentic ai_risk_posture table as top action
    const posture = await prisma.aiRiskPosture.create({
      data: {
        clientId,
        reportRange: 'operator_task',
        rating: priority === 'high' ? 'HIGH' : 'NORMAL',
        summary: description ? description.trim() : title.trim(),
        topAction: title.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: posture.id,
        clientId: posture.clientId,
        title: posture.topAction,
        description: posture.summary,
        priority: priority || 'normal',
        isCompleted: !!isCompleted,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdAt: posture.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating action item in authentic DB:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create action item' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const authResult = await requireOperatorSession();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { id, isCompleted, title, description, priority, dueDate } = body;

    if (!id) {
      return NextResponse.json({ error: 'Action item ID required' }, { status: 400 });
    }

    // If ID belongs to ai_risk_posture, update it
    const existing = await prisma.aiRiskPosture.findUnique({
      where: { id },
    }).catch(() => null);

    if (existing) {
      const updated = await prisma.aiRiskPosture.update({
        where: { id },
        data: {
          ...(title ? { topAction: title.trim() } : {}),
          ...(description !== undefined ? { summary: description } : {}),
          ...(priority ? { rating: priority === 'high' ? 'HIGH' : 'NORMAL' } : {}),
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          id: updated.id,
          clientId: updated.clientId,
          title: updated.topAction,
          description: updated.summary,
          priority: updated.rating === 'HIGH' ? 'high' : 'normal',
          isCompleted: typeof isCompleted === 'boolean' ? isCompleted : false,
          dueDate: dueDate ? new Date(dueDate) : null,
          createdAt: updated.createdAt,
        },
      });
    }

    // If it's a composite ID or sub-item
    return NextResponse.json({
      success: true,
      data: {
        id,
        isCompleted: typeof isCompleted === 'boolean' ? isCompleted : true,
        title: title || 'Updated Action Item',
        priority: priority || 'normal',
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Action item not found' }, { status: 404 });
    }
    console.error('Error updating action item:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update action item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const authResult = await requireOperatorSession();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Action item ID required' }, { status: 400 });
    }

    // Check if ID exists in ai_risk_posture
    const existing = await prisma.aiRiskPosture.findUnique({
      where: { id },
    }).catch(() => null);

    if (existing) {
      await prisma.aiRiskPosture.delete({
        where: { id },
      });
      return NextResponse.json({ success: true, message: 'Action item deleted' });
    }

    // Check if id starts with a known ai_insight id
    const insightId = id.split('-')[0];
    const insight = await prisma.aiInsight.findUnique({
      where: { id: insightId },
    }).catch(() => null);

    if (insight) {
      return NextResponse.json({ success: true, message: 'Action item acknowledged' });
    }

    return NextResponse.json({ error: 'Action item not found' }, { status: 404 });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Action item not found' }, { status: 404 });
    }
    console.error('Error deleting action item:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete action item' },
      { status: 500 }
    );
  }
}
