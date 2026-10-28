import { NextRequest, NextResponse } from 'next/server';
import OAuthClient from 'intuit-oauth';
import prisma from '@/lib/prisma';
import { generateOAuthState } from '@/lib/crypto';
import { getServerSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  let returnTo = 'dashboard';
  const baseUrl = process.env.NEXT_PUBLIC_URL || '';

  try {
    const session = await getServerSession();
    const searchParams = request.nextUrl.searchParams;
    const requestedClientId = searchParams.get('clientId');
    returnTo = searchParams.get('returnTo') || 'dashboard';

    // Zero-Trust Session Invariant: Unauthenticated callers cannot initiate OAuth flows
    if (!session) {
      return NextResponse.redirect(`${baseUrl}/login?error=auth_required`);
    }

    let targetClientId: string | undefined;

    // Operators can link any designated tenant or default client
    if (session.role === 'operator') {
      targetClientId = requestedClientId || session.clientId;
      if (!targetClientId) {
        const primaryClient = await prisma.client.findFirst({
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
        });
        targetClientId = primaryClient?.id;
      }
    } else {
      // Client users are strictly constrained to their own verified tenant
      if (!session.clientId) {
        const clientRecord = await prisma.client.findUnique({ where: { email: session.email } });
        targetClientId = clientRecord?.id;
      } else {
        targetClientId = session.clientId;
      }
    }

    if (!targetClientId) {
      return NextResponse.redirect(`${baseUrl}/dashboard?error=client_not_found`);
    }

    const oauthClient = new OAuthClient({
      clientId: process.env.QBO_CLIENT_ID || 'dummy_client_id',
      clientSecret: process.env.QBO_CLIENT_SECRET || 'dummy_client_secret',
      environment: process.env.QBO_ENVIRONMENT === 'production' ? 'production' : 'sandbox',
      redirectUri: process.env.QBO_REDIRECT_URI || `${baseUrl}/api/quickbooks/callback`,
    });

    // Generate cryptographically signed, timestamped CSRF state
    const signedState = generateOAuthState(targetClientId, returnTo);

    const authUri = oauthClient.authorizeUri({
      scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId],
      state: signedState,
    });

    return NextResponse.redirect(authUri);
  } catch (error) {
    console.error('QuickBooks auth initiation error:', error);
    const fallbackPath = returnTo === 'dashboard' ? '/dashboard' : returnTo === 'connect' ? '/connect' : '/admin/dashboard';
    return NextResponse.redirect(`${baseUrl}${fallbackPath}?error=auth_init_failed`);
  }
}