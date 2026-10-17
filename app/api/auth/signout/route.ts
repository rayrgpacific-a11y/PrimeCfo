import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const isRealSupabase =
      supabaseUrl &&
      !supabaseUrl.includes('your-project-ref') &&
      supabaseAnonKey &&
      !supabaseAnonKey.includes('your-supabase');

    if (isRealSupabase) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      await supabase.auth.signOut().catch(() => {});
    }

    const cookieStore = await cookies();
    cookieStore.delete('primecfo_session');

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Signout error:', err);
    return NextResponse.json({ ok: true });
  }
}
