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
  iat?: number;
  exp?: number;
}

export const SESSION_COOKIE_NAME = 'primecfo_session';

/**
 * Creates a signed session cookie string with strict server-side TTL
 */
export function serializeSession(session: SessionUser): string {
  const now = Date.now();
  const sessionWithExpiry: SessionUser = {
    ...session,
    iat: session.iat || now,
    exp: session.exp || now + 7 * 24 * 60 * 60 * 1000, // 7 days expiration invariant
  };
  const jsonStr = JSON.stringify(sessionWithExpiry);
  const base64 = Buffer.from(jsonStr, 'utf8').toString('base64url');
  return signPayload(base64);
}

/**
 * Extracts and verifies the current session from incoming request cookies,
 * enforcing signature integrity and server-side expiration.
 */
export async function getServerSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const rawCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!rawCookie) return null;

    const payload = verifySignedPayload(rawCookie);
    if (!payload) return null;

    const jsonStr = Buffer.from(payload, 'base64url').toString('utf8');
    const user = JSON.parse(jsonStr) as SessionUser;

    // Strict server-side expiration check to prevent perpetual replay attacks
    if (user.exp && Date.now() > user.exp) {
      console.warn(`[SECURITY] Session expired for user ${user.email} (exp: ${new Date(user.exp).toISOString()})`);
      return null;
    }

    return user;
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
 * Common public/free email providers that should NOT be used as company names.
 */
export const PUBLIC_EMAIL_DOMAINS = new Set([
  'gmail', 'yahoo', 'ymail', 'rocketmail', 'hotmail', 'outlook', 'live', 'msn',
  'icloud', 'me', 'mac', 'proton', 'protonmail', 'pm', 'zoho', 'aol', 'mail',
  'gmx', 'yandex', 'fastmail', 'tutanota', 'tutamail', 'comcast', 'sbcglobal',
  'verizon', 'att'
]);

/**
 * Helper to extract an intuitive client name and business entity name from an email
 */
export function deriveClientAndCompany(email: string, explicitCompany?: string) {
  const parts = email.trim().toLowerCase().split('@');
  const localPart = parts[0] || 'client';
  const domainPart = parts[1] || '';

  const nameTokens = localPart
    .split(/[._+-]/)
    .filter(Boolean)
    .filter((s) => !/^\d+$/.test(s))
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase());

  const formattedClientName = nameTokens.join(' ') || 'Client User';
  const domainBase = domainPart.replace(/\.[^.]+$/, '').toLowerCase();
  const isGeneric = PUBLIC_EMAIL_DOMAINS.has(domainBase);

  let derivedCompany: string;
  if (explicitCompany && explicitCompany.trim()) {
    derivedCompany = explicitCompany.trim();
  } else if (!isGeneric && domainBase) {
    derivedCompany = domainBase
      .split(/[._-]/)
      .filter(Boolean)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
      .join(' ');
  } else {
    // For generic/public email providers (e.g. @gmail.com), never use the provider name.
    // Filter out common filler prefixes like 'web', 'admin', 'contact', 'info'
    const meaningfulTokens = nameTokens.filter(
      (t) => !['web', 'admin', 'contact', 'info', 'support', 'mail', 'office'].includes(t.toLowerCase())
    );
    const baseName = meaningfulTokens.length > 0 ? meaningfulTokens.join(' ') : formattedClientName;
    derivedCompany = `${baseName} Holdings`;
  }

  return { formattedClientName, derivedCompany };
}

/**
 * Ensures a Client database record exists for a given email address.
 * Generates an intuitive clientName and companyName based on email/input if new.
 */
export async function getOrCreateClientForEmail(email: string, companyName?: string, plan?: string) {
  const cleanEmail = email.trim().toLowerCase();
  let client = await prisma.client.findUnique({
    where: { email: cleanEmail },
  });

  const { formattedClientName, derivedCompany } = deriveClientAndCompany(cleanEmail, companyName);

  if (!client) {
    client = await prisma.client.create({
      data: {
        email: cleanEmail,
        clientName: formattedClientName,
        companyName: derivedCompany,
        clientType: plan ? plan.toUpperCase() : 'STARTER',
        tags: plan ? [plan.toLowerCase(), '14-day-trial'] : ['14-day-trial'],
        isActive: true,
      },
    });
  } else {
    // Self-healing: if an existing client has a generic provider name ("Gmail", "Yahoo", etc.) as their companyName
    const currentCompany = (client.companyName || '').toLowerCase().trim();
    if (PUBLIC_EMAIL_DOMAINS.has(currentCompany)) {
      client = await prisma.client.update({
        where: { id: client.id },
        data: {
          companyName: derivedCompany,
        },
      });
    }
  }

  return client;
}

export interface TenantSessionContext {
  session: SessionUser;
  targetClientId: string;
}

/**
 * Guard for routes requiring access to a specific client tenant.
 * Guarantees zero cross-tenant data leakage by strictly binding non-operator
 * users to their own verified clientId.
 */
export async function requireTenantSession(
  targetClientId?: string
): Promise<TenantSessionContext | NextResponse> {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Operators can access any designated tenant or fall back to assigned
  if (session.role === 'operator') {
    return {
      session,
      targetClientId: targetClientId || session.clientId || '',
    };
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

  // Non-operator clients MUST have a resolved clientId
  if (!session.clientId) {
    return NextResponse.json(
      { error: 'Forbidden: Unauthorized tenant session' },
      { status: 403 }
    );
  }

  // Client users can ONLY access their own assigned tenant
  if (targetClientId && session.clientId !== targetClientId) {
    return NextResponse.json(
      { error: 'Forbidden: Access to this organization is denied' },
      { status: 403 }
    );
  }

  return {
    session,
    targetClientId: session.clientId,
  };
}
