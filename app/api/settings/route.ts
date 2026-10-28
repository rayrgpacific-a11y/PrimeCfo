import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenantSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedClientId = searchParams.get('clientId');

    const authResult = await requireTenantSession(requestedClientId || undefined);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { session } = authResult;
    let clientId = session.role === 'operator' ? (requestedClientId || session.clientId) : session.clientId;

    if (!clientId && session.role === 'operator') {
      const firstClient = await prisma.client.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      });
      clientId = firstClient?.id;
    }

    if (!clientId) {
      return NextResponse.json({ error: 'Tenant session not resolved' }, { status: 400 });
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        qboTokens: {
          select: { companyId: true, accessToken: true, updatedAt: true },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // 1. Resolve authentic reporting basis from native client columns
    const reportingBasis = client.reportingBasisOverride || client.qboReportBasis || 'cash';

    // 2. Resolve email preferences from authentic email_preferences table
    let weeklyEmail = true;
    let anomalyAlerts = true;

    if (client.userId) {
      try {
        const emailPref = await prisma.emailPreference.findUnique({
          where: { userId: client.userId },
        });
        if (emailPref) {
          weeklyEmail = emailPref.aiSummaryEnabled;
          anomalyAlerts = emailPref.marketingEnabled;
        }
      } catch (prefErr) {
        console.warn('Could not read email_preferences in settings:', prefErr);
      }
    }

    // 3. Resolve unified QuickBooks connection status
    let isQbConnected = false;
    let qboCompanyId: string | null = null;
    let lastSync: string | null = null;

    // Check authentic quickbooks_connections table
    const qbConn = await prisma.quickbooksConnection.findFirst({
      where: { clientId, status: 'connected' },
      orderBy: { updatedAt: 'desc' },
    });

    if (qbConn) {
      isQbConnected = true;
      qboCompanyId = qbConn.realmId;
      lastSync = qbConn.updatedAt ? new Date(qbConn.updatedAt).toLocaleDateString() : null;
    } else {
      // Check client_qbo_connections table
      const clientConn = await prisma.clientQboConnection.findFirst({
        where: { clientId, status: 'connected' },
        orderBy: { updatedAt: 'desc' },
      });

      if (clientConn) {
        isQbConnected = true;
        qboCompanyId = clientConn.companyId || clientConn.realmId || null;
        lastSync = clientConn.updatedAt ? new Date(clientConn.updatedAt).toLocaleDateString() : null;
      } else {
        // Fallback to qboTokens
        const token = client.qboTokens?.[0];
        if (token && token.accessToken) {
          isQbConnected = true;
          qboCompanyId = token.companyId || null;
          lastSync = token.updatedAt ? new Date(token.updatedAt).toLocaleDateString() : null;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        clientId: client.id,
        email: client.email,
        clientName: client.clientName,
        companyName: client.companyName || client.clientName,
        phone: client.phone || '',
        reportingBasis,
        weeklyEmail,
        anomalyAlerts,
        plan: client.clientType || 'UNDERSTAND',
        isQbConnected,
        qboCompanyId,
        lastSync,
      },
    });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Database error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientId: requestedClientId, companyName, phone, reportingBasis, weeklyEmail, anomalyAlerts } = body;

    const authResult = await requireTenantSession(requestedClientId || undefined);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { session } = authResult;
    const clientId = session.role === 'operator' ? (requestedClientId || session.clientId) : session.clientId;

    if (!clientId) {
      return NextResponse.json({ error: 'Tenant session not resolved' }, { status: 400 });
    }

    const existingClient = await prisma.client.findUnique({ where: { id: clientId } });
    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Format reportingBasis to match database CHECK constraint ('Cash' or 'Accrual')
    const formattedBasis = reportingBasis
      ? (String(reportingBasis).trim().toLowerCase() === 'accrual' ? 'Accrual' : 'Cash')
      : undefined;

    // 1. Update native columns in clients table (never corrupt human advisor notes)
    const updated = await prisma.client.update({
      where: { id: clientId },
      data: {
        ...(companyName ? { companyName: String(companyName).slice(0, 100).trim() } : {}),
        ...(typeof phone === 'string' ? { phone: phone.slice(0, 30).trim() } : {}),
        ...(formattedBasis ? {
          qboReportBasis: formattedBasis,
          reportingBasisOverride: formattedBasis
        } : {}),
      },
    });

    // 2. Persist email notification preferences in authentic email_preferences table
    if (existingClient.userId && (typeof weeklyEmail === 'boolean' || typeof anomalyAlerts === 'boolean')) {
      try {
        await prisma.emailPreference.upsert({
          where: { userId: existingClient.userId },
          create: {
            userId: existingClient.userId,
            aiSummaryEnabled: typeof weeklyEmail === 'boolean' ? weeklyEmail : true,
            marketingEnabled: typeof anomalyAlerts === 'boolean' ? anomalyAlerts : true,
          },
          update: {
            ...(typeof weeklyEmail === 'boolean' ? { aiSummaryEnabled: weeklyEmail } : {}),
            ...(typeof anomalyAlerts === 'boolean' ? { marketingEnabled: anomalyAlerts } : {}),
          },
        });
      } catch (prefSaveErr) {
        console.warn('Could not update email_preferences in settings POST:', prefSaveErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        clientId: updated.id,
        companyName: updated.companyName,
        phone: updated.phone,
        reportingBasis: updated.reportingBasisOverride || updated.qboReportBasis || 'cash',
        weeklyEmail: typeof weeklyEmail === 'boolean' ? weeklyEmail : true,
        anomalyAlerts: typeof anomalyAlerts === 'boolean' ? anomalyAlerts : true,
      },
    });
  } catch (error) {
    console.error('Settings POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save settings' },
      { status: 500 }
    );
  }
}
