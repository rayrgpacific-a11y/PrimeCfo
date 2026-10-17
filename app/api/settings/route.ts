import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenantSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const authResult = await requireTenantSession();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { session } = authResult;
    const clientId = session.clientId;

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

    let parsedPreferences = {
      reportingBasis: 'cash',
      weeklyEmail: true,
      anomalyAlerts: true,
    };

    if (client.notes) {
      try {
        const stored = JSON.parse(client.notes);
        if (typeof stored === 'object' && stored !== null) {
          parsedPreferences = { ...parsedPreferences, ...stored };
        }
      } catch {
        // notes was not JSON, keep defaults
      }
    }

    const token = client.qboTokens?.[0];
    const isQbConnected = !!(token && token.accessToken);

    return NextResponse.json({
      success: true,
      data: {
        clientId: client.id,
        email: client.email,
        clientName: client.clientName,
        companyName: client.companyName || client.clientName,
        phone: client.phone || '',
        reportingBasis: parsedPreferences.reportingBasis,
        weeklyEmail: parsedPreferences.weeklyEmail,
        anomalyAlerts: parsedPreferences.anomalyAlerts,
        plan: client.clientType || 'UNDERSTAND',
        isQbConnected,
        qboCompanyId: token?.companyId || null,
        lastSync: token?.updatedAt ? new Date(token.updatedAt).toLocaleDateString() : null,
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
    const authResult = await requireTenantSession();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { session } = authResult;
    const clientId = session.clientId;

    if (!clientId) {
      return NextResponse.json({ error: 'Tenant session not resolved' }, { status: 400 });
    }

    const body = await request.json();
    const { companyName, phone, reportingBasis, weeklyEmail, anomalyAlerts } = body;

    const existingClient = await prisma.client.findUnique({ where: { id: clientId } });
    let currentPrefs: Record<string, any> = {};
    if (existingClient?.notes) {
      try {
        currentPrefs = JSON.parse(existingClient.notes);
      } catch {
        currentPrefs = {};
      }
    }

    const updatedPrefs = {
      ...currentPrefs,
      reportingBasis: reportingBasis || currentPrefs.reportingBasis || 'cash',
      weeklyEmail: typeof weeklyEmail === 'boolean' ? weeklyEmail : currentPrefs.weeklyEmail ?? true,
      anomalyAlerts: typeof anomalyAlerts === 'boolean' ? anomalyAlerts : currentPrefs.anomalyAlerts ?? true,
    };

    const updated = await prisma.client.update({
      where: { id: clientId },
      data: {
        ...(companyName ? { companyName } : {}),
        ...(typeof phone === 'string' ? { phone } : {}),
        notes: JSON.stringify(updatedPrefs),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Settings POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save settings' },
      { status: 500 }
    );
  }
}
