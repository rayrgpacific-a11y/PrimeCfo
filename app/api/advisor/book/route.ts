import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenantSession } from '@/lib/auth';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveAuthUserId(
  userId?: string | null,
  email?: string | null,
  clientId?: string | null,
  isOperator: boolean = false
): Promise<string> {
  // 1. If provided userId is a valid UUID, verify if it exists in auth.users
  if (userId && UUID_REGEX.test(userId)) {
    try {
      const match = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM auth.users WHERE id = ${userId}::uuid LIMIT 1
      `;
      if (match.length > 0) return match[0].id;
    } catch {}
  }

  // 2. Check if the client record has a linked user_id in auth.users
  if (clientId) {
    try {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { userId: true },
      });
      if (client?.userId) return client.userId;
    } catch {}
  }

  // 3. Check auth.users by email
  if (email) {
    try {
      const matchEmail = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM auth.users WHERE lower(email) = lower(${email}) LIMIT 1
      `;
      if (matchEmail.length > 0) return matchEmail[0].id;
    } catch {}
  }

  // 4. Default to primary advisor ONLY if caller is an operator
  if (isOperator) {
    try {
      const defaultUser = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
      `;
      if (defaultUser.length > 0) return defaultUser[0].id;
    } catch {}
  }

  throw new Error('No authentic auth.users record found to link booking');
}

export async function GET(request: Request) {
  try {
    const authResult = await requireTenantSession();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { session } = authResult;
    const isOperator = session.role === 'operator';
    let authUserId: string | null = null;
    try {
      authUserId = await resolveAuthUserId(session.userId, session.email, session.clientId, isOperator);
    } catch {}

    // Strict Client Isolation: If client user has no auth user ID, return empty array immediately
    if (!isOperator && !authUserId) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const where = isOperator ? undefined : { userId: authUserId as string };
    const bookings = await prisma.advisorBooking.findMany({
      where,
      orderBy: { scheduledAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error('Fetch advisor bookings error:', error);
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
    const body = await request.json().catch(() => ({}));
    const { scheduledAt, eventType, calendlyEventUri, calendlyInviteeUri } = body;

    if (!scheduledAt) {
      return NextResponse.json(
        { error: 'Scheduled date and time is required' },
        { status: 400 }
      );
    }

    const parsedDate = new Date(scheduledAt);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    const validAuthUserId = await resolveAuthUserId(
      session.userId,
      session.email,
      session.clientId,
      session.role === 'operator'
    );

    const booking = await prisma.advisorBooking.create({
      data: {
        userId: validAuthUserId,
        scheduledAt: parsedDate,
        eventType: eventType || 'CFO Strategic Advisory Session',
        calendlyEventUri: calendlyEventUri || null,
        calendlyInviteeUri: calendlyInviteeUri || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Advisor session scheduled successfully',
      booking,
    });
  } catch (error) {
    console.error('Create advisor booking error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save advisor booking' },
      { status: 500 }
    );
  }
}
