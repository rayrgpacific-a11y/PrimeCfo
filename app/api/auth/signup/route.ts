import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getOrCreateClientForEmail } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password, companyName } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 12) {
      return NextResponse.json(
        { error: 'Password must be at least 12 characters' },
        { status: 400 }
      );
    }

    // Automatically provision Client tenant record in Prisma
    let clientRecord: any = null;
    try {
      clientRecord = await getOrCreateClientForEmail(email, companyName);
    } catch (clientErr) {
      console.warn('Could not auto-provision client in Prisma during signup:', clientErr);
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const isRealSupabase =
      supabaseUrl &&
      !supabaseUrl.includes('your-project-ref') &&
      supabaseAnonKey &&
      !supabaseAnonKey.includes('your-supabase');

    if (isRealSupabase) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            clientId: clientRecord?.id,
            tenantName: clientRecord?.companyName || clientRecord?.clientName,
          },
        },
      });

      if (error) {
        return NextResponse.json(
          { error: error.message || 'Registration failed' },
          { status: 400 }
        );
      }

      const needsEmailConfirmation = !data.session;
      return NextResponse.json({
        ok: true,
        needsEmailConfirmation,
        user: { email: data.user?.email, clientId: clientRecord?.id },
      });
    }

    // Local / Dev Mode fallback
    return NextResponse.json({
      ok: true,
      needsEmailConfirmation: true,
      user: { email, clientId: clientRecord?.id },
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
