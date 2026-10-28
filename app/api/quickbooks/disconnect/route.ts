import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenantSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let clientIdParam = searchParams.get('clientId');

    if (!clientIdParam) {
      try {
        const body = await request.json();
        clientIdParam = body?.clientId || null;
      } catch {
        // Body was empty or non-JSON
      }
    }

    const authResult = await requireTenantSession(clientIdParam || undefined);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { session } = authResult;
    const targetClientId = session.role === 'operator' ? (clientIdParam || session.clientId) : session.clientId;

    if (!targetClientId) {
      return NextResponse.json({ error: 'Client ID required' }, { status: 400 });
    }

    // 1. Mark connections as disconnected in Prisma
    await prisma.clientQboConnection.updateMany({
      where: { clientId: targetClientId },
      data: {
        status: 'disconnected',
        syncEnabled: false,
        notes: `Disconnected by ${session.email} on ${new Date().toISOString()}`,
      },
    });

    await prisma.quickbooksConnection.updateMany({
      where: { clientId: targetClientId },
      data: {
        status: 'disconnected',
        lastRefreshError: `Disconnected by ${session.email} on ${new Date().toISOString()}`,
      },
    });

    // 2. Remove encrypted tokens from vault
    await prisma.qboToken.deleteMany({
      where: { clientId: targetClientId },
    });

    console.log(`✅ Client ${targetClientId} QuickBooks connection successfully disconnected`);

    return NextResponse.json({
      success: true,
      message: 'QuickBooks account disconnected successfully.',
    });
  } catch (error) {
    console.error('Error disconnecting QuickBooks:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to disconnect' },
      { status: 500 }
    );
  }
}
