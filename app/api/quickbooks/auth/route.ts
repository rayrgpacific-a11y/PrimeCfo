import { NextRequest, NextResponse } from 'next/server';
import OAuthClient from 'intuit-oauth';
import prisma from '@/lib/prisma';
import { generateOAuthState } from '@/lib/crypto';
import { getServerSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  let returnTo = 'dashboard';
  try {
    const session = await getServerSession();
    const searchParams = request.nextUrl.searchParams;
    const requestedClientId = searchParams.get('clientId');
    returnTo = searchParams.get('returnTo') || 'dashboard';

    // If caller has a session, ensure they can only connect their own tenant unless they are an operator
    let targetClientId = requestedClientId || session?.clientId;
    if (session && session.role !== 'operator') {
      if (!session.clientId) {
        const clientRecord = await prisma.client.findUnique({ where: { email: session.email } });
        targetClientId = clientRecord?.id || session.userId;
      } else {
        targetClientId = session.clientId;
      }
    }

    // Fallback to first client in DB only if operator and none provided
    if (!targetClientId) {
      if (session?.role === 'operator') {
        const defaultClient = await prisma.client.findFirst();
        targetClientId = defaultClient?.id || 'demo-client';
      } else {
        targetClientId = 'demo-client';
      }
    }

    const oauthClient = new OAuthClient({
      clientId: process.env.QBO_CLIENT_ID || 'dummy_client_id',
      clientSecret: process.env.QBO_CLIENT_SECRET || 'dummy_client_secret',
      environment: process.env.QBO_ENVIRONMENT === 'production' ? 'production' : 'sandbox',
      redirectUri: process.env.QBO_REDIRECT_URI || `${process.env.NEXT_PUBLIC_URL}/api/quickbooks/callback`,
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
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_URL || ''}${fallbackPath}?error=auth_init_failed`);
  }
}