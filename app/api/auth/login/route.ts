import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import prisma from '@/lib/prisma';
import { serializeSession, SESSION_COOKIE_NAME, SessionUser, getOrCreateClientForEmail } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const serverAdminPassword = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'primecfo2024';

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const isRealSupabase =
      supabaseUrl &&
      !supabaseUrl.includes('your-project-ref') &&
      supabaseAnonKey &&
      !supabaseAnonKey.includes('your-supabase');

    let authenticatedUserId = '';
    let isOperator = false;
    let clientId: string | undefined;
    let tenantName: string | undefined;

    // Check if this is an Operator / Admin login
    const isOperatorAttempt = cleanEmail === 'admin@primecfo.ai' || cleanEmail === 'operator@primecfo.ai';

    if (isOperatorAttempt && password === serverAdminPassword) {
      isOperator = true;
      authenticatedUserId = 'operator-master-id';
    } else if (password === serverAdminPassword) {
      // Client login with master/demo password
      isOperator = false;
      authenticatedUserId = `client-${cleanEmail.replace(/[^a-z0-9]/g, '-')}`;
    } else if (isRealSupabase) {
      // Authenticate via Supabase Auth
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      } else if (data.user) {
        authenticatedUserId = data.user.id;
        // Check if user has operator metadata in Supabase
        isOperator = data.user.user_metadata?.role === 'operator' || cleanEmail.endsWith('@primecfo.ai');
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // If client user, resolve or auto-provision tenant ID from database
    if (!isOperator) {
      try {
        const clientRecord = await getOrCreateClientForEmail(cleanEmail);
        if (clientRecord) {
          clientId = clientRecord.id;
          tenantName = clientRecord.companyName || clientRecord.clientName;
        }
      } catch (dbErr) {
        console.warn('Could not lookup or provision client by email in Prisma:', dbErr);
      }
    }

    const sessionPayload: SessionUser = {
      email: cleanEmail,
      userId: authenticatedUserId,
      role: isOperator ? 'operator' : 'client_user',
      clientId,
      tenantName,
    };

    const signedCookieValue = serializeSession(sessionPayload);
    const cookieStore = await cookies();

    cookieStore.set(SESSION_COOKIE_NAME, signedCookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({
      ok: true,
      user: {
        email: cleanEmail,
        role: sessionPayload.role,
        clientId,
        tenantName,
      },
      isOperator,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
