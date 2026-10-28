import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenantSession } from '@/lib/auth';
import { synthesizeAiInsightsForClient } from '@/lib/ai-insights';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedClientId = searchParams.get('clientId');
    const forceRefresh = searchParams.get('refresh') === 'true';

    const authResult = await requireTenantSession(requestedClientId || undefined);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { session } = authResult;
    let targetClientId = session.role === 'operator' ? (requestedClientId || session.clientId) : session.clientId;

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
          riskPosture: null,
          insights: [],
        },
      });
    }

    // 1. Fetch authentic AI Risk Posture
    let riskPosture = await prisma.aiRiskPosture.findFirst({
      where: { clientId: targetClientId },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Fetch authentic AI Insights for THIS tenant only
    let insights = await prisma.aiInsight.findMany({
      where: { clientId: targetClientId },
      orderBy: { severityOrder: 'asc' },
    });

    // 3. If no insights exist yet for this client, or forceRefresh is requested, synthesize dynamically
    if (forceRefresh || insights.length === 0) {
      const synthesized = await synthesizeAiInsightsForClient(targetClientId);
      if (synthesized) {
        riskPosture = await prisma.aiRiskPosture.findFirst({
          where: { clientId: targetClientId },
          orderBy: { createdAt: 'desc' },
        });

        insights = await prisma.aiInsight.findMany({
          where: { clientId: targetClientId },
          orderBy: { severityOrder: 'asc' },
        });
      }
    }

    const formattedInsights = insights.map((i) => ({
      id: i.id,
      title: i.title,
      description: i.description,
      urgency: i.urgency || 'info',
      category: i.category || 'General',
      metric: i.metric || null,
      metricValue: i.metricValue || null,
      recommendations: Array.isArray(i.recommendations) ? i.recommendations : [],
      talkingPoints: Array.isArray(i.talkingPoints) ? i.talkingPoints : [],
      severityOrder: i.severityOrder,
      createdAt: i.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        clientId: targetClientId,
        riskPosture: riskPosture
          ? {
              id: riskPosture.id,
              rating: riskPosture.rating,
              summary: riskPosture.summary,
              topAction: riskPosture.topAction,
              reportRange: riskPosture.reportRange,
              createdAt: riskPosture.createdAt,
            }
          : null,
        insights: formattedInsights,
      },
    });
  } catch (error) {
    console.error('Fetch AI insights error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Database error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedClientId = searchParams.get('clientId');

    const authResult = await requireTenantSession(requestedClientId || undefined);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { session } = authResult;
    let targetClientId = session.role === 'operator' ? (requestedClientId || session.clientId) : session.clientId;

    if (!targetClientId) {
      return NextResponse.json({ error: 'Client ID required' }, { status: 400 });
    }

    await synthesizeAiInsightsForClient(targetClientId);

    const riskPosture = await prisma.aiRiskPosture.findFirst({
      where: { clientId: targetClientId },
      orderBy: { createdAt: 'desc' },
    });

    const insights = await prisma.aiInsight.findMany({
      where: { clientId: targetClientId },
      orderBy: { severityOrder: 'asc' },
    });

    const formattedInsights = insights.map((i) => ({
      id: i.id,
      title: i.title,
      description: i.description,
      urgency: i.urgency || 'info',
      category: i.category || 'General',
      metric: i.metric || null,
      metricValue: i.metricValue || null,
      recommendations: Array.isArray(i.recommendations) ? i.recommendations : [],
      talkingPoints: Array.isArray(i.talkingPoints) ? i.talkingPoints : [],
      severityOrder: i.severityOrder,
      createdAt: i.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        clientId: targetClientId,
        riskPosture: riskPosture
          ? {
              id: riskPosture.id,
              rating: riskPosture.rating,
              summary: riskPosture.summary,
              topAction: riskPosture.topAction,
              reportRange: riskPosture.reportRange,
              createdAt: riskPosture.createdAt,
            }
          : null,
        insights: formattedInsights,
      },
    });
  } catch (error) {
    console.error('Synthesize AI insights error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Synthesis error' },
      { status: 500 }
    );
  }
}

