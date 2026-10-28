import { NextResponse } from 'next/server';
import { getServerSession, getOrCreateClientForEmail, PUBLIC_EMAIL_DOMAINS } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let clientId = session.clientId || null;
    let tenantName = session.tenantName || null;

    // Dynamically ensure client tenant is resolved and up to date for client users
    if (session.role !== 'operator') {
      try {
        let clientRecord = null;
        if (clientId) {
          clientRecord = await prisma.client.findUnique({ where: { id: clientId } });
        }
        // If not found or if the company name is still a generic provider name ("Gmail", "Yahoo", etc.)
        if (
          !clientRecord ||
          !clientRecord.companyName ||
          PUBLIC_EMAIL_DOMAINS.has((clientRecord.companyName || '').toLowerCase().trim())
        ) {
          clientRecord = await getOrCreateClientForEmail(session.email);
        }

        if (clientRecord) {
          clientId = clientRecord.id;
          tenantName = clientRecord.companyName || clientRecord.clientName;
        }
      } catch (clientErr) {
        console.warn('Could not resolve client in /api/me:', clientErr);
      }
    }

    let isQbConnected = false;
    let qboCompanyId: string | null = null;

    if (clientId) {
      try {
        // 1. Check authentic quickbooks_connections table
        const qbConn = await prisma.quickbooksConnection.findFirst({
          where: { clientId, status: 'connected' },
          orderBy: { updatedAt: 'desc' },
        });

        if (qbConn) {
          isQbConnected = true;
          qboCompanyId = qbConn.realmId || null;
        } else {
          // 2. Check client_qbo_connections table
          const clientConn = await prisma.clientQboConnection.findFirst({
            where: { clientId, status: 'connected' },
            orderBy: { updatedAt: 'desc' },
          });

          if (clientConn) {
            isQbConnected = true;
            qboCompanyId = clientConn.companyId || clientConn.realmId || null;
          } else {
            // 3. Fallback to qbo_tokens
            const token = await prisma.qboToken.findUnique({
              where: { clientId },
              select: { companyId: true, accessToken: true },
            });
            if (token && token.accessToken) {
              isQbConnected = true;
              qboCompanyId = token.companyId || null;
            }
          }
        }
      } catch (dbErr) {
        console.warn('Could not check QuickBooks connections in /api/me:', dbErr);
      }
    }

    return NextResponse.json({
      email: session.email,
      userId: session.userId,
      role: session.role,
      isOperator: session.role === 'operator',
      clientId,
      tenantName,
      isQbConnected,
      qboCompanyId,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
