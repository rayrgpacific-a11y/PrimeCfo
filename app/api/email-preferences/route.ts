import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/qbo/supabaseAdmin';

export type EmailPreferences = {
  ai_summary_enabled: boolean;
  marketing_enabled: boolean;
  unsubscribed_at: string | null;
  welcome_snapshot_sent_at: string | null;
  last_summary_sent_at: string | null;
};

const DEFAULTS: EmailPreferences = {
  ai_summary_enabled: true,
  marketing_enabled: false,
  unsubscribed_at: null,
  welcome_snapshot_sent_at: null,
  last_summary_sent_at: null,
};

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

/** GET /api/email-preferences */
export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const sb = supabaseAdmin();
  const { data } = await sb
    .from('email_preferences')
    .select(
      'ai_summary_enabled, marketing_enabled, unsubscribed_at, welcome_snapshot_sent_at, last_summary_sent_at'
    )
    .eq('user_id', user.id)
    .maybeSingle();

  return NextResponse.json({
    preferences: (data as EmailPreferences | null) ?? { ...DEFAULTS },
    cadenceNote:
      'Starter/See: monthly AI summary. Understand/Act: weekly AI summary. Matches your plan entitlement.',
    welcomeEmailLog: await loadWelcomeEmailLog(user.id),
  });
}

async function loadWelcomeEmailLog(userId: string) {
  const sb = supabaseAdmin();
  const { data } = await sb
    .from('report_email_log')
    .select('recipient, provider_message_id, status, error_detail, created_at')
    .eq('user_id', userId)
    .eq('email_type', 'welcome_snapshot')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

/** PUT /api/email-preferences — update toggles or unsubscribe */
export async function PUT(request: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    ai_summary_enabled?: boolean;
    marketing_enabled?: boolean;
    unsubscribe?: boolean;
  };

  const sb = supabaseAdmin();
  const { data: existing } = await sb
    .from('email_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  const next = {
    user_id: user.id,
    ai_summary_enabled:
      body.unsubscribe === true
        ? false
        : body.ai_summary_enabled ?? existing?.ai_summary_enabled ?? true,
    marketing_enabled:
      body.unsubscribe === true
        ? false
        : body.marketing_enabled ?? existing?.marketing_enabled ?? false,
    unsubscribed_at:
      body.unsubscribe === true
        ? new Date().toISOString()
        : body.ai_summary_enabled === true
          ? null
          : existing?.unsubscribed_at ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await sb
    .from('email_preferences')
    .upsert(next, { onConflict: 'user_id' })
    .select(
      'ai_summary_enabled, marketing_enabled, unsubscribed_at, welcome_snapshot_sent_at, last_summary_sent_at'
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ preferences: data });
}
