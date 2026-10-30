/**

 * Plain-English AI summary emails (monthly/weekly per entitlement) + Welcome Snapshot.

 */

import { supabaseAdmin } from '@/lib/qbo/supabaseAdmin';

import { getPlanEntitlements } from '@/lib/billing/entitlements';

import { buildReportPdfData, money } from '@/lib/reports/buildReportPdfData';

import { renderReportPdf } from '@/lib/reports/renderReportPdf';

import { fetchClientsWithLastSync } from '@/lib/clients/list';



type ClientRow = {

  client_id: string;

  company_name?: string | null;

  client_name?: string | null;

  user_id?: string | null;

  client_qbo_connections?: Array<{ status?: string; connected_at?: string | null }> | null;

};



const WELCOME_DELAY_DAYS = 7;



function customerFromAddress(): string {

  return (

    process.env.AI_SUMMARY_EMAIL_FROM?.trim() ||

    process.env.STRIPE_CUSTOMER_EMAIL_FROM?.trim() ||

    'PrimeCFO.ai <insights@primecfo.ai>'

  );

}



type SendResult = { messageId: string | null; sent: boolean; error?: string };



async function logEmailAttempt(opts: {

  userId: string;

  clientId?: string | null;

  emailType: 'welcome_snapshot' | 'ai_summary';

  recipient: string;

  status: 'pending' | 'sent' | 'failed' | 'skipped';

  providerMessageId?: string | null;

  errorDetail?: string | null;

}): Promise<void> {

  const sb = supabaseAdmin();

  await sb.from('report_email_log').insert({

    user_id: opts.userId,

    client_id: opts.clientId ?? null,

    email_type: opts.emailType,

    recipient: opts.recipient,

    status: opts.status,

    provider_message_id: opts.providerMessageId ?? null,

    error_detail: opts.errorDetail ?? null,

  });

}



async function sendViaResend(opts: {

  to: string;

  subject: string;

  text: string;

  html: string;

  attachments?: Array<{ filename: string; content: Buffer }>;

}): Promise<SendResult> {

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {

    console.info(`[ai-summary-email] RESEND_API_KEY not set — would send to ${opts.to}: ${opts.subject}`);

    return { messageId: null, sent: false, error: 'RESEND_API_KEY not configured' };

  }



  const body: Record<string, unknown> = {

    from: customerFromAddress(),

    to: [opts.to],

    subject: opts.subject,

    text: opts.text,

    html: opts.html,

  };

  if (opts.attachments?.length) {

    body.attachments = opts.attachments.map((a) => ({

      filename: a.filename,

      content: a.content.toString('base64'),

    }));

  }



  const res = await fetch('https://api.resend.com/emails', {

    method: 'POST',

    headers: {

      Authorization: `Bearer ${apiKey}`,

      'Content-Type': 'application/json',

    },

    body: JSON.stringify(body),

  });

  const detail = await res.text().catch(() => '');

  if (!res.ok) {

    return { messageId: null, sent: false, error: `Resend ${res.status}: ${detail.slice(0, 200)}` };

  }



  let messageId: string | null = null;

  try {

    const json = JSON.parse(detail) as { id?: string };

    messageId = json.id ?? null;

  } catch {

    messageId = null;

  }



  return { messageId, sent: true };

}



function escapeHtml(s: string): string {

  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

}



function daysSince(iso: string): number {

  const then = new Date(iso).getTime();

  const now = Date.now();

  return Math.floor((now - then) / (1000 * 60 * 60 * 24));

}



export async function sendWelcomeSnapshot(

  userId: string,

  email: string,

  clientId: string,

  opts?: { force?: boolean }

): Promise<{ sent: boolean; messageId: string | null }> {

  const sb = supabaseAdmin();



  const [{ data: prefs }, { data: conn }] = await Promise.all([

    sb

      .from('email_preferences')

      .select('ai_summary_enabled, unsubscribed_at, welcome_snapshot_sent_at')

      .eq('user_id', userId)

      .maybeSingle(),

    sb

      .from('client_qbo_connections')

      .select('connected_at, status')

      .eq('client_id', clientId)

      .eq('status', 'connected')

      .order('connected_at', { ascending: false })

      .limit(1)

      .maybeSingle(),

  ]);



  if (prefs?.unsubscribed_at || prefs?.ai_summary_enabled === false) {

    await logEmailAttempt({

      userId,

      clientId,

      emailType: 'welcome_snapshot',

      recipient: email,

      status: 'skipped',

      errorDetail: 'User unsubscribed or summaries disabled',

    });

    return { sent: false, messageId: null };

  }



  if (prefs?.welcome_snapshot_sent_at && !opts?.force) {

    return { sent: false, messageId: null };

  }



  const connectedAt = conn?.connected_at as string | undefined;

  if (connectedAt && !opts?.force && daysSince(connectedAt) < WELCOME_DELAY_DAYS) {

    await logEmailAttempt({

      userId,

      clientId,

      emailType: 'welcome_snapshot',

      recipient: email,

      status: 'skipped',

      errorDetail: `Waiting ${WELCOME_DELAY_DAYS} days after QB connect (connected ${connectedAt})`,

    });

    return { sent: false, messageId: null };

  }



  const data = await buildReportPdfData(clientId, '3m');

  const pdf = await renderReportPdf(data);



  const subject = `Your PrimeCFO.ai Welcome Snapshot — ${data.companyName}`;

  const text = [

    `Welcome to PrimeCFO.ai.`,

    ``,

    `Here's a first look at ${data.companyName} (${data.rangeLabel}, ${data.displayBasis} basis):`,

    `Revenue: ${money(data.summary.revenue)}`,

    `Net income: ${money(data.summary.netIncome)}`,

    `Cash: ${money(data.summary.cash)}`,

    data.arAging ? `Open A/R (aging): ${money(data.arAging.total)}` : '',

    ``,

    `A PDF snapshot is attached. Manage email preferences anytime in Settings.`,

  ]

    .filter(Boolean)

    .join('\n');



  const html = `

    <div style="font-family:system-ui,sans-serif;color:#0f172a;max-width:560px">

      <p style="color:#0f766e;font-weight:700;font-size:18px;margin:0 0 12px">PrimeCFO.ai</p>

      <h1 style="font-size:20px;margin:0 0 12px">Welcome Snapshot</h1>

      <p>Here's a first look at <strong>${escapeHtml(data.companyName)}</strong>

        (${escapeHtml(data.rangeLabel)}, ${escapeHtml(data.displayBasis)} basis).</p>

      <ul>

        <li>Revenue: <strong>${escapeHtml(money(data.summary.revenue))}</strong></li>

        <li>Net income: <strong>${escapeHtml(money(data.summary.netIncome))}</strong></li>

        <li>Cash: <strong>${escapeHtml(money(data.summary.cash))}</strong></li>

        ${

          data.arAging

            ? `<li>Open A/R (aging): <strong>${escapeHtml(money(data.arAging.total))}</strong></li>`

            : ''

        }

      </ul>

      <p style="color:#64748b;font-size:13px">PDF attached. Manage preferences in Settings → Email summaries.</p>

    </div>`;



  const sendResult = await sendViaResend({

    to: email,

    subject,

    text,

    html,

    attachments: [{ filename: `PrimeCFO-Welcome-${data.range}.pdf`, content: pdf }],

  });



  if (!sendResult.sent) {

    await logEmailAttempt({

      userId,

      clientId,

      emailType: 'welcome_snapshot',

      recipient: email,

      status: 'failed',

      errorDetail: sendResult.error ?? 'Send failed',

    });

    return { sent: false, messageId: null };

  }



  await logEmailAttempt({

    userId,

    clientId,

    emailType: 'welcome_snapshot',

    recipient: email,

    status: 'sent',

    providerMessageId: sendResult.messageId,

  });



  await sb.from('email_preferences').upsert(

    {

      user_id: userId,

      welcome_snapshot_sent_at: new Date().toISOString(),

      updated_at: new Date().toISOString(),

      ai_summary_enabled: prefs?.ai_summary_enabled ?? true,

      marketing_enabled: false,

    },

    { onConflict: 'user_id' }

  );



  return { sent: true, messageId: sendResult.messageId };

}



/** Cron: send Welcome Snapshot to users 7+ days after first QB connect. */

export async function processDueWelcomeSnapshots(): Promise<{

  sent: number;

  skipped: number;

  errors: string[];

}> {

  const sb = supabaseAdmin();

  let sent = 0;

  let skipped = 0;

  const errors: string[] = [];



  const { data: connections } = await sb

    .from('client_qbo_connections')

    .select('client_id, user_id, connected_at, status')

    .eq('status', 'connected')

    .not('connected_at', 'is', null);



  for (const conn of connections ?? []) {

    try {

      const connectedAt = conn.connected_at as string;

      if (daysSince(connectedAt) < WELCOME_DELAY_DAYS) {

        skipped++;

        continue;

      }



      const userId = conn.user_id as string;

      const clientId = conn.client_id as string;

      if (!userId) {

        skipped++;

        continue;

      }



      const { data: authUser } = await sb.auth.admin.getUserById(userId);

      const email = authUser?.user?.email;

      if (!email) {

        skipped++;

        continue;

      }



      const result = await sendWelcomeSnapshot(userId, email, clientId);

      if (result.sent) sent++;

      else skipped++;

    } catch (e) {

      errors.push(e instanceof Error ? e.message : String(e));

    }

  }



  return { sent, skipped, errors };

}



export async function sendScheduledAiSummaries(opts?: {

  forceWeekly?: boolean;

}): Promise<{ sent: number; skipped: number; errors: string[] }> {

  const sb = supabaseAdmin();

  const now = new Date();

  const day = now.getUTCDay(); // 0=Sun

  const isMonday = day === 1;

  const isFirstOfMonth = now.getUTCDate() === 1;



  const { data: subs } = await sb

    .from('stripe_subscriptions')

    .select('user_id, plan_id, status')

    .in('status', ['active', 'trialing', 'past_due']);



  let sent = 0;

  let skipped = 0;

  const errors: string[] = [];



  for (const sub of subs ?? []) {

    try {

      const entitlements = getPlanEntitlements(sub.plan_id);

      const weekly = entitlements.aiSummaryCadence === 'weekly';

      const due =

        opts?.forceWeekly ||

        (weekly && isMonday) ||

        (!weekly && isFirstOfMonth);

      if (!due) {

        skipped++;

        continue;

      }



      const { data: prefs } = await sb

        .from('email_preferences')

        .select('*')

        .eq('user_id', sub.user_id)

        .maybeSingle();



      if (prefs?.unsubscribed_at || prefs?.ai_summary_enabled === false) {

        skipped++;

        continue;

      }



      const { data: authUser } = await sb.auth.admin.getUserById(sub.user_id);

      const email = authUser?.user?.email;

      if (!email) {

        skipped++;

        continue;

      }



      const allClients = (await fetchClientsWithLastSync()) as ClientRow[];

      const clients = allClients.filter((c) => c.user_id === sub.user_id);

      const client =

        clients.find((c) =>

          (c.client_qbo_connections ?? []).some((q) => q.status === 'connected')

        ) ?? clients[0];

      if (!client) {

        skipped++;

        continue;

      }



      const data = await buildReportPdfData(

        client.client_id,

        '12m',

        client.company_name ?? client.client_name ?? undefined

      );

      const pdf = await renderReportPdf(data);

      const cadence = weekly ? 'Weekly' : 'Monthly';

      const subject = `${cadence} financial summary — ${data.companyName}`;

      const text = [

        `${cadence} summary for ${data.companyName} (${data.rangeLabel}):`,

        `Revenue ${money(data.summary.revenue)} · Net ${money(data.summary.netIncome)} · Cash ${money(data.summary.cash)}`,

        data.arAging ? `Open A/R ${money(data.arAging.total)}` : '',

        `PDF attached. Unsubscribe in Settings → Email summaries.`,

      ]

        .filter(Boolean)

        .join('\n');



      const html = `

        <div style="font-family:system-ui,sans-serif;color:#0f172a;max-width:560px">

          <p style="color:#0f766e;font-weight:700">PrimeCFO.ai</p>

          <h1 style="font-size:18px">${escapeHtml(cadence)} financial summary</h1>

          <p><strong>${escapeHtml(data.companyName)}</strong> — ${escapeHtml(data.rangeLabel)}</p>

          <ul>

            <li>Revenue: ${escapeHtml(money(data.summary.revenue))}</li>

            <li>Net income: ${escapeHtml(money(data.summary.netIncome))}</li>

            <li>Cash: ${escapeHtml(money(data.summary.cash))}</li>

            ${

              data.arAging

                ? `<li>Open A/R: ${escapeHtml(money(data.arAging.total))}</li>`

                : ''

            }

          </ul>

          <p style="font-size:12px;color:#64748b">Manage or unsubscribe in Settings → Email summaries.</p>

        </div>`;



      const sendResult = await sendViaResend({

        to: email,

        subject,

        text,

        html,

        attachments: [{ filename: `PrimeCFO-Summary-${data.range}.pdf`, content: pdf }],

      });



      if (!sendResult.sent) {

        await logEmailAttempt({

          userId: sub.user_id,

          clientId: client.client_id,

          emailType: 'ai_summary',

          recipient: email,

          status: 'failed',

          errorDetail: sendResult.error,

        });

        errors.push(sendResult.error ?? 'Send failed');

        continue;

      }



      await logEmailAttempt({

        userId: sub.user_id,

        clientId: client.client_id,

        emailType: 'ai_summary',

        recipient: email,

        status: 'sent',

        providerMessageId: sendResult.messageId,

      });



      await sb.from('email_preferences').upsert(

        {

          user_id: sub.user_id,

          last_summary_sent_at: now.toISOString(),

          updated_at: now.toISOString(),

          ai_summary_enabled: true,

          marketing_enabled: prefs?.marketing_enabled ?? false,

        },

        { onConflict: 'user_id' }

      );

      sent++;

    } catch (e) {

      errors.push(e instanceof Error ? e.message : String(e));

    }

  }



  return { sent, skipped, errors };

}

