import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/qbo/supabaseAdmin';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * POST /api/calendly/webhook
 * Calendly invitee.created — logs booking against the user matched by email.
 * Set CALENDLY_WEBHOOK_SIGNING_KEY in env.
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  const signingKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY?.trim();

  if (signingKey) {
    const signature = request.headers.get('calendly-webhook-signature') ?? '';
    // Calendly: t=timestamp,v1=signature
    const parts = Object.fromEntries(
      signature.split(',').map((p) => {
        const [k, ...rest] = p.split('=');
        return [k?.trim(), rest.join('=')];
      })
    );
    const t = parts.t;
    const v1 = parts.v1;
    if (!t || !v1) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }
    const payload = `${t}.${raw}`;
    const expected = createHmac('sha256', signingKey).update(payload).digest('hex');
    try {
      const ok = timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
      if (!ok) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    } catch {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  let body: {
    event?: string;
    payload?: {
      email?: string;
      scheduled_event?: { start_time?: string; uri?: string; event_type?: string };
      uri?: string;
    };
  };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.event !== 'invitee.created') {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const email = body.payload?.email?.toLowerCase()?.trim();
  if (!email) return NextResponse.json({ ok: true, skipped: 'no email' });

  const sb = supabaseAdmin();
  const { data: users } = await sb.auth.admin.listUsers({ perPage: 1000 });
  const user = users?.users?.find((u) => u.email?.toLowerCase() === email);
  if (!user) {
    console.info('[calendly] booking for unknown email', email);
    return NextResponse.json({ ok: true, matched: false });
  }

  const { error } = await sb.from('advisor_bookings').insert({
    user_id: user.id,
    calendly_event_uri: body.payload?.scheduled_event?.uri ?? null,
    calendly_invitee_uri: body.payload?.uri ?? null,
    event_type: body.payload?.scheduled_event?.event_type ?? null,
    scheduled_at: body.payload?.scheduled_event?.start_time ?? null,
  });

  if (error) {
    console.error('[calendly] insert failed', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, matched: true, userId: user.id });
}
