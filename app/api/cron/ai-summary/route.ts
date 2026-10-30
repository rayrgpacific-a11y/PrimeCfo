import { NextRequest, NextResponse } from 'next/server';
import { sendScheduledAiSummaries, processDueWelcomeSnapshots } from '@/lib/email/aiSummaryEmail';

export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * GET /api/cron/ai-summary
 * Vercel cron: Mondays → weekly (Understand/Act); 1st of month → monthly (Starter/See).
 * Auth: CRON_SECRET bearer or Vercel cron header.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET?.trim();
  const vercelCron = request.headers.get('x-vercel-cron');
  const ok =
    (cronSecret && auth === `Bearer ${cronSecret}`) ||
    (!!vercelCron && !cronSecret) ||
    (cronSecret && request.nextUrl.searchParams.get('secret') === cronSecret);

  if (!ok && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [summaryResult, welcomeResult] = await Promise.all([
      sendScheduledAiSummaries(),
      processDueWelcomeSnapshots(),
    ]);
    return NextResponse.json({
      ok: true,
      ...summaryResult,
      welcomeSnapshots: welcomeResult,
    });
  } catch (e) {
    console.error('[cron/ai-summary]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed' },
      { status: 500 }
    );
  }
}
