import { NextRequest, NextResponse } from 'next/server';
import OAuthClient from 'intuit-oauth';
import prisma from '@/lib/prisma';
import { verifyOAuthState, encryptToken } from '@/lib/crypto';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const realmId = searchParams.get('realmId'); // QBO Company ID
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

  console.log('=== QuickBooks OAuth Callback Received ===');

  if (!code || !state) {
    console.error('❌ Missing code or state in OAuth callback');
    return NextResponse.redirect(`${baseUrl}/admin/dashboard?error=invalid_callback`);
  }

  // Cryptographically verify state against CSRF
  const verifiedState = verifyOAuthState(state);
  if (!verifiedState) {
    console.error('❌ Invalid or expired OAuth CSRF state');
    return NextResponse.redirect(`${baseUrl}/admin/dashboard?error=csrf_validation_failed`);
  }

  const { clientId, returnTo } = verifiedState;

  try {
    const oauthClient = new OAuthClient({
      clientId: process.env.QBO_CLIENT_ID || '',
      clientSecret: process.env.QBO_CLIENT_SECRET || '',
      environment: process.env.QBO_ENVIRONMENT === 'production' ? 'production' : 'sandbox',
      redirectUri: process.env.QBO_REDIRECT_URI || `${baseUrl}/api/quickbooks/callback`,
    });

    console.log('Creating OAuth token with Intuit...');
    const authResponse = await oauthClient.createToken(request.url);
    const tokenObj = authResponse.token;

    console.log('✅ Token obtained. Encrypting tokens with AES-256-GCM before DB write...');
    const encryptedAccessToken = encryptToken(tokenObj.access_token);
    const encryptedRefreshToken = encryptToken(tokenObj.refresh_token);
    const expiresAt = new Date(Date.now() + (tokenObj.expires_in || 3600) * 1000);

    // Resolve active client ID in database to guarantee valid foreign keys
    let activeClientId = clientId;
    const clientExists = await prisma.client.findUnique({ where: { id: clientId } });
    if (!clientExists) {
      const defaultClient = await prisma.client.findFirst();
      if (defaultClient) {
        activeClientId = defaultClient.id;
      }
    }

    // Persist to Prisma QboToken model with encrypted tokens
    await prisma.qboToken.upsert({
      where: { clientId: activeClientId },
      create: {
        clientId: activeClientId,
        companyId: realmId,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt,
      },
      update: {
        companyId: realmId,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt,
      },
    });

    // Update or create connection record
    const existingConn = await prisma.clientQboConnection.findFirst({
      where: { clientId: activeClientId, companyId: realmId || '' },
    });

    if (existingConn) {
      await prisma.clientQboConnection.update({
        where: { id: existingConn.id },
        data: {
          status: 'connected',
          connectedAt: new Date(),
          syncEnabled: true,
          sandboxMode: process.env.QBO_ENVIRONMENT !== 'production',
        },
      });
    } else {
      await prisma.clientQboConnection.create({
        data: {
          clientId: activeClientId,
          companyId: realmId || 'unknown_realm',
          realmId: realmId,
          status: 'connected',
          connectedAt: new Date(),
          syncEnabled: true,
          sandboxMode: process.env.QBO_ENVIRONMENT !== 'production',
          notes: `Connected via Intuit OAuth on ${new Date().toISOString()}`,
        },
      });
    }

    console.log('✅ Connection and encrypted tokens persisted via Prisma');

    const redirectPath = returnTo === 'dashboard'
      ? '/dashboard?connected=true'
      : returnTo === 'connect'
      ? '/connect?connected=true'
      : returnTo === 'clients'
      ? '/admin/clients/add?connected=true'
      : '/admin/dashboard?connected=true';

    return NextResponse.redirect(`${baseUrl}${redirectPath}`);
  } catch (error) {
    console.error('❌ OAuth token exchange error:', error);
    const redirectPath = returnTo === 'dashboard'
      ? '/dashboard?error=connection_failed'
      : returnTo === 'connect'
      ? '/connect?error=connection_failed'
      : '/admin/dashboard?error=connection_failed';

    return NextResponse.redirect(`${baseUrl}${redirectPath}`);
  }
}