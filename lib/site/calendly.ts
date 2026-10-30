/**
 * Single source of truth for Prime advisor Calendly booking URLs.
 * Monthly Advisory Session slug is currently `30min` — rename in Calendly when ready.
 */
import type { ProductTier } from '@/lib/tiers';
import type { AdvisoryMeeting } from '@/lib/billing/entitlements';

export const CALENDLY_BASE = 'https://calendly.com/andrew-primecfo';

export const CALENDLY_EVENTS = {
  /** New signups during 14-day trial (any tier). */
  trialWelcome: `${CALENDLY_BASE}/primecfo-ai-trial-welcome-call`,
  /** Understand — 1-hr quarterly advisory. */
  understand: `${CALENDLY_BASE}/primecfo-ai-quarterly-advisory-session`,
  /** Act — 1-hr monthly advisory (slug leftover from event creation). */
  act: `${CALENDLY_BASE}/30min`,
} as const;

export type AdvisorBookingContext = {
  /** Stripe subscription status (e.g. trialing, active). */
  status?: string | null;
  tier?: ProductTier | string | null;
  /** Plan entitlement for advisory cadence. */
  advisoryMeeting?: AdvisoryMeeting | null;
};

/**
 * Resolve the correct Calendly event for this subscriber.
 * Trialing → Welcome Call. Act → monthly. Understand → quarterly.
 * Starter/See (no advisory) and unknown → Welcome Call as soft CTA.
 */
export function advisorUrl(ctx: AdvisorBookingContext = {}): string {
  if (ctx.status === 'trialing') return CALENDLY_EVENTS.trialWelcome;

  const meeting = ctx.advisoryMeeting;
  if (meeting === 'monthly' || ctx.tier === 'act') return CALENDLY_EVENTS.act;
  if (meeting === 'quarterly' || ctx.tier === 'understand') return CALENDLY_EVENTS.understand;

  return CALENDLY_EVENTS.trialWelcome;
}

/** @deprecated Prefer advisorUrl(ctx) — kept for marketing pages without billing context. */
export const CALENDAR_URL = CALENDLY_EVENTS.trialWelcome;
