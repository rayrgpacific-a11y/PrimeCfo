import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { serializeSession, SESSION_COOKIE_NAME, SessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { factorId, code, email } = await request.json();

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { error: 'Please enter a valid 6-digit authentication code' },
        { status: 400 }
      );
    }

    if (!email || !factorId) {
      return NextResponse.json(
        { error: 'Email and factor identifier are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const isRealSupabase =
      supabaseUrl &&
      !supabaseUrl.includes('your-project-ref') &&
      supabaseAnonKey &&
      !supabaseAnonKey.includes('your-supabase');

    let isVerified = false;
    let userId = factorId;

    if (isRealSupabase) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      // Cryptographically verify TOTP factor challenge with Supabase Auth
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code,
      });

      if (error || !data) {
        return NextResponse.json(
          { error: error?.message || 'Invalid authentication code' },
          { status: 401 }
        );
      }
      isVerified = true;
      userId = data.user?.id || factorId;
    } else {
      // Non-production fallback only
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'MFA service configuration error' },
          { status: 500 }
        );
      }
      if (code === '123456') {
        isVerified = true;
      } else {
        return NextResponse.json(
          { error: 'Invalid code in development mode' },
          { status: 401 }
        );
      }
    }

    if (!isVerified) {
      return NextResponse.json({ error: 'MFA verification failed' }, { status: 401 });
    }

    const isOperator =
      cleanEmail === 'admin@primecfo.ai' ||
      cleanEmail === 'operator@primecfo.ai' ||
      cleanEmail.endsWith('@primecfo.ai');

    let clientId: string | undefined;
    let tenantName: string | undefined;

    if (!isOperator) {
      const clientRecord = await prisma.client.findUnique({ where: { email: cleanEmail } });
      if (clientRecord) {
        clientId = clientRecord.id;
        tenantName = clientRecord.companyName || clientRecord.clientName;
      }
    }

    const sessionUser: SessionUser = {
      email: cleanEmail,
      userId,
      role: isOperator ? 'operator' : 'client_user',
      clientId,
      tenantName,
    };

    const signedCookieValue = serializeSession(sessionUser);

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, signedCookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ ok: true, user: sessionUser });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'MFA verification failed' },
      { status: 500 }
    );
  }
}
