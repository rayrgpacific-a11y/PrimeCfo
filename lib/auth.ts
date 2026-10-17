import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { signPayload, verifySignedPayload } from './crypto';
import prisma from './prisma';

export interface SessionUser {
  email: string;
  userId: string;
  role: 'operator' | 'client_user';
  clientId?: string;
  tenantName?: string;
}

export const SESSION_COOKIE_NAME = 'primecfo_session';

/**
 * Creates a signed session cookie string
 */
export function serializeSession(session: SessionUser): string {
  const jsonStr = JSON.stringify(session);
  const base64 = Buffer.from(jsonStr, 'utf8').toString('base64url');
  return signPayload(base64);
}

/**
 * Extracts and verifies the current session from incoming request cookies
 */
export async function getServerSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const rawCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!rawCookie) return null;

    const payload = verifySignedPayload(rawCookie);
    if (!payload) return null;

    const jsonStr = Buffer.from(payload, 'base64url').toString('utf8');
    return JSON.parse(jsonStr) as SessionUser;
  } catch (error) {
    console.error('Failed to parse session:', error);
    return null;
  }
}

/**
 * Guard for routes requiring Operator (CFO Admin) privileges
 */
export async function requireOperatorSession(): Promise<{ session: SessionUser } | NextResponse> {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  if (session.role !== 'operator') {
    return NextResponse.json(
      { error: 'Forbidden: Operator privileges required' },
      { status: 403 }
    );
  }

  return { session };
}


/**
 * Ensures a Client database record exists for a given email address.
 * Generates an intuitive clientName and companyName based on email/input if new.
 */
export async function getOrCreateClientForEmail(email: string, companyName?: string) {
  const cleanEmail = email.trim().toLowerCase();
  let client = await prisma.client.findUnique({
    where: { email: cleanEmail },
  });

  if (!client) {
    const parts = cleanEmail.split('@');
    const localPart = parts[0] || 'client';
    const domainPart = parts[1] || '';

    const formattedClientName = localPart
      .split(/[._-]/)
      .filter(Boolean)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ') || 'Client User';

    const domainBase = domainPart.replace(/\.[^.]+$/, '');
    const derivedCompany =
      companyName ||
      domainBase
        .split(/[._-]/)
        .filter(Boolean)
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(' ') ||
      `${formattedClientName} Co`;

    client = await prisma.client.create({
      data: {
        email: cleanEmail,
        clientName: formattedClientName,
        companyName: derivedCompany,
        isActive: true,
      },
    });
  }

  return client;
}

/**
 * Guard for routes requiring access to a specific client tenant
 */
export async function requireTenantSession(targetClientId?: string): Promise<{ session: SessionUser } | NextResponse> {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Operators can access any tenant
  if (session.role === 'operator') {
    return { session };
  }

  // Ensure client user has their clientId resolved
  if (!session.clientId) {
    try {
      const clientRecord = await getOrCreateClientForEmail(session.email);
      session.clientId = clientRecord.id;
      session.tenantName = clientRecord.companyName || clientRecord.clientName;
    } catch (e) {
      console.warn('Failed to resolve client tenant for session:', e);
    }
  }

  // Client users can ONLY access their own assigned tenant
  if (targetClientId && session.clientId && session.clientId !== targetClientId) {
    return NextResponse.json(
      { error: 'Forbidden: Access to this organization is denied' },
      { status: 403 }
    );
  }

  if (targetClientId && !session.clientId) {
    return NextResponse.json(
      { error: 'Forbidden: Unauthorized tenant access' },
      { status: 403 }
    );
  }

  return { session };
}
