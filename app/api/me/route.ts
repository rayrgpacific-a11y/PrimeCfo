import { NextResponse } from 'next/server';
import { getServerSession, getOrCreateClientForEmail } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let clientId = session.clientId || null;
    let tenantName = session.tenantName || null;

    // Dynamically ensure client tenant is resolved for client users
    if (session.role !== 'operator' && (!clientId || !tenantName)) {
      try {
        const clientRecord = await getOrCreateClientForEmail(session.email);
        clientId = clientRecord.id;
        tenantName = clientRecord.companyName || clientRecord.clientName;
      } catch (clientErr) {
        console.warn('Could not resolve client in /api/me:', clientErr);
      }
    }

    let isQbConnected = false;
    let qboCompanyId: string | null = null;

    if (clientId) {
      try {
        const token = await prisma.qboToken.findUnique({
          where: { clientId },
          select: { companyId: true, accessToken: true },
        });
        if (token && token.accessToken) {
          isQbConnected = true;
          qboCompanyId = token.companyId || null;
        }
      } catch (dbErr) {
        console.warn('Could not check qboToken in /api/me:', dbErr);
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
