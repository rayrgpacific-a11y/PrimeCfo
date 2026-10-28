import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getOrCreateClientForEmail } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password, companyName, plan } = await request.json();

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

    const cleanEmail = email.trim().toLowerCase();
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
        email: cleanEmail,
        password,
      });

      if (error) {
        return NextResponse.json(
          { error: error.message || 'Registration failed' },
          { status: 400 }
        );
      }

      // Provision tenant record in database only after Supabase user is confirmed valid
      let clientRecord: any = null;
      try {
        clientRecord = await getOrCreateClientForEmail(cleanEmail, companyName, plan);
      } catch (clientErr) {
        console.warn('Could not auto-provision client in Prisma during signup:', clientErr);
      }

      const needsEmailConfirmation = !data.session;
      return NextResponse.json({
        ok: true,
        needsEmailConfirmation,
        user: { email: data.user?.email || cleanEmail, clientId: clientRecord?.id },
      });
    }

    // Local / Dev Mode fallback (when Supabase credentials not yet configured)
    let clientRecord: any = null;
    try {
      clientRecord = await getOrCreateClientForEmail(cleanEmail, companyName, plan);
    } catch (clientErr) {
      console.warn('Could not auto-provision client in Prisma in dev fallback:', clientErr);
    }

    return NextResponse.json({
      ok: true,
      needsEmailConfirmation: true,
      user: { email: cleanEmail, clientId: clientRecord?.id },
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
