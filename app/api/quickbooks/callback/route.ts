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

    // Strictly validate that the client ID from verified state exists in the database
    const clientRecord = await prisma.client.findUnique({ where: { id: clientId } });
    if (!clientRecord) {
      console.error(`❌ Client ID ${clientId} from verified OAuth state does not exist in database`);
      return NextResponse.redirect(`${baseUrl}/admin/dashboard?error=invalid_tenant_binding`);
    }
    const activeClientId = clientRecord.id;

    const targetCompanyId = realmId || 'unknown_realm';

    // Persist to Prisma QboToken model with encrypted tokens
    const existingToken = await prisma.qboToken.findFirst({
      where: { clientId: activeClientId },
    });

    if (existingToken) {
      await prisma.qboToken.update({
        where: { id: existingToken.id },
        data: {
          companyId: targetCompanyId,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresAt,
        },
      });
    } else {
      await prisma.qboToken.create({
        data: {
          clientId: activeClientId,
          companyId: targetCompanyId,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresAt,
        },
      });
    }

    // Update or create connection record in client_qbo_connections
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

    // Synchronize quickbooks_connections table for backward compatibility
    const existingQbConn = await prisma.quickbooksConnection.findFirst({
      where: { clientId: activeClientId },
    });

    if (existingQbConn) {
      await prisma.quickbooksConnection.update({
        where: { id: existingQbConn.id },
        data: {
          realmId: targetCompanyId,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          accessExpiresAt: expiresAt,
          refreshExpiresAt: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000),
          status: 'connected',
        },
      });
    } else {
      await prisma.quickbooksConnection.create({
        data: {
          clientId: activeClientId,
          realmId: targetCompanyId,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          accessExpiresAt: expiresAt,
          refreshExpiresAt: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000),
          status: 'connected',
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