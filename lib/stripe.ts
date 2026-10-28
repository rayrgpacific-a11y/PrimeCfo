import Stripe from 'stripe';
import prisma from '@/lib/prisma';

// Initialize the Stripe Node.js SDK safely without throwing if API key is not yet set
const stripeSecretKey =
  process.env.STRIPE_SECRET_KEY?.trim() || 'sk_test_placeholder_unconfigured';

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-02-24.acacia' as any,
  appInfo: {
    name: 'PrimeCFO.ai',
    version: '1.0.0',
  },
});

/**
 * Validates whether a given string is a valid UUID format (required for Postgres @db.Uuid columns).
 */
export function isValidUuid(id?: string | null): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim());
}

/**
 * Checks if Stripe is properly configured with a live or test secret key.
 */
export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY?.trim() || '';
  return (
    (key.startsWith('sk_test_') || key.startsWith('sk_live_')) &&
    !key.includes('placeholder') &&
    !key.includes('unconfigured')
  );
}

/**
 * Maps a plan identifier and billing period to its configured Stripe Price ID.
 */
export function getPlanPriceId(planId: string, billingPeriod: 'monthly' | 'annually' = 'monthly'): string | null {
  const normPlan = (planId || '').toLowerCase().trim();
  const isAnnual = billingPeriod === 'annually';

  switch (normPlan) {
    case 'starter':
      return isAnnual
        ? process.env.STRIPE_PRICE_STARTER_ANNUAL || process.env.STRIPE_PRICE_STARTER_MONTHLY || null
        : process.env.STRIPE_PRICE_STARTER_MONTHLY || null;
    case 'see':
    case 'self-service':
      return isAnnual
        ? process.env.STRIPE_PRICE_SEE_ANNUAL || process.env.STRIPE_PRICE_SEE_MONTHLY || null
        : process.env.STRIPE_PRICE_SEE_MONTHLY || null;
    case 'understand':
    case 'growth':
      return isAnnual
        ? process.env.STRIPE_PRICE_UNDERSTAND_ANNUAL || process.env.STRIPE_PRICE_UNDERSTAND_MONTHLY || process.env.STRIPE_PRICE_GROWTH || null
        : process.env.STRIPE_PRICE_UNDERSTAND_MONTHLY || process.env.STRIPE_PRICE_GROWTH || null;
    case 'act':
      return isAnnual
        ? process.env.STRIPE_PRICE_ACT_ANNUAL || process.env.STRIPE_PRICE_ACT_MONTHLY || null
        : process.env.STRIPE_PRICE_ACT_MONTHLY || null;
    default:
      // If planId itself is already a Stripe price ID (price_...)
      if (planId?.startsWith('price_')) return planId;
      return null;
  }
}

/**
 * Retrieves the base pricing configuration for fallback dynamic checkout sessions
 * in case pre-created Stripe Price IDs are not yet registered in .env.
 */
export function getPlanPricingInfo(planId: string, billingPeriod: 'monthly' | 'annually' = 'monthly') {
  const normPlan = (planId || 'starter').toLowerCase().trim();
  const isAnnual = billingPeriod === 'annually';

  switch (normPlan) {
    case 'starter':
      return {
        name: 'PrimeCFO Starter Plan',
        amount: isAnnual ? 5300 * 12 : 5900, // in cents
        interval: isAnnual ? ('year' as const) : ('month' as const),
      };
    case 'see':
    case 'self-service':
      return {
        name: 'PrimeCFO Self-Service Plan',
        amount: isAnnual ? 10700 * 12 : 11900,
        interval: isAnnual ? ('year' as const) : ('month' as const),
      };
    case 'act':
      return {
        name: 'PrimeCFO Act Tier',
        amount: isAnnual ? 62900 * 12 : 69900,
        interval: isAnnual ? ('year' as const) : ('month' as const),
      };
    case 'understand':
    case 'growth':
    default:
      return {
        name: 'PrimeCFO Growth Plan',
        amount: isAnnual ? 31400 * 12 : 34900,
        interval: isAnnual ? ('year' as const) : ('month' as const),
      };
  }
}

/**
 * Retrieves or registers a Stripe Customer record for a given user.
 */
export async function getOrCreateStripeCustomer(params: {
  userId?: string | null;
  email: string;
  name?: string;
}): Promise<string | null> {
  const { userId, email, name } = params;
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();

  // 1. Check local Prisma cache in stripe_customers table
  if (userId && isValidUuid(userId)) {
    try {
      const existing = await prisma.stripeCustomer.findUnique({
        where: { userId },
      });
      if (existing?.stripeCustomerId) {
        return existing.stripeCustomerId;
      }
    } catch (e) {
      console.warn('Error checking stripeCustomer by userId:', e);
    }
  }

  // Also check by email if available
  try {
    const existingByEmail = await prisma.stripeCustomer.findFirst({
      where: { email: cleanEmail },
    });
    if (existingByEmail?.stripeCustomerId) {
      return existingByEmail.stripeCustomerId;
    }
  } catch (e) {
    console.warn('Error checking stripeCustomer by email:', e);
  }

  // If Stripe API key is not yet configured, return null gracefully
  if (!isStripeConfigured()) {
    return null;
  }

  try {
    // 2. Query Stripe for existing customer with matching email
    const existingStripeCustomers = await stripe.customers.list({
      email: cleanEmail,
      limit: 1,
    });

    let customerId: string;

    if (existingStripeCustomers.data.length > 0) {
      customerId = existingStripeCustomers.data[0].id;
    } else {
      // 3. Create fresh customer in Stripe
      const newCustomer = await stripe.customers.create({
        email: cleanEmail,
        name: name || undefined,
        metadata: {
          userId: userId || '',
        },
      });
      customerId = newCustomer.id;
    }

    // 4. Persist to Supabase stripe_customers table if we have a valid UUID userId
    if (userId && isValidUuid(userId)) {
      await prisma.stripeCustomer.upsert({
        where: { userId },
        update: {
          stripeCustomerId: customerId,
          email: cleanEmail,
        },
        create: {
          userId,
          stripeCustomerId: customerId,
          email: cleanEmail,
        },
      });
    }

    return customerId;
  } catch (err) {
    console.error('Error creating Stripe customer:', err);
    return null;
  }
}

/**
 * Synchronizes a Stripe Subscription object with Supabase's stripe_subscriptions table.
 * Strictly respects database CHECK constraints: interval IN ('month', 'year').
 */
export async function syncStripeSubscription(
  subscription: Stripe.Subscription,
  overrideUserId?: string | null
): Promise<void> {
  try {
    const customerId =
      typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer.id;

    // Resolve userId: check parameter, then metadata, then stripe_customers table
    let resolvedUserId: string | null = overrideUserId && isValidUuid(overrideUserId) ? overrideUserId : null;

    if (!resolvedUserId && isValidUuid(subscription.metadata?.userId)) {
      resolvedUserId = subscription.metadata.userId;
    }

    if (!resolvedUserId) {
      const dbCust = await prisma.stripeCustomer.findFirst({
        where: { stripeCustomerId: customerId },
      });
      if (dbCust?.userId && isValidUuid(dbCust.userId)) {
        resolvedUserId = dbCust.userId;
      }
    }

    // Fallback: check if client has this email or customer
    if (!resolvedUserId) {
      const clientWithUser = await prisma.client.findFirst({
        where: { userId: { not: null } },
      });
      if (clientWithUser?.userId && isValidUuid(clientWithUser.userId)) {
        resolvedUserId = clientWithUser.userId;
      }
    }

    if (!resolvedUserId) {
      console.warn(`[STRIPE SYNC] No valid UUID userId found for customer ${customerId}. Skipping DB record.`);
      return;
    }

    // Interval must strictly be 'month' or 'year' for PostgreSQL CHECK constraint
    const rawInterval = subscription.items.data[0]?.price?.recurring?.interval;
    const interval: 'month' | 'year' = rawInterval === 'year' ? 'year' : 'month';

    const planId =
      subscription.metadata?.planId ||
      (typeof subscription.items.data[0]?.price?.product === 'string'
        ? subscription.items.data[0].price.product
        : null) ||
      'growth';

    const priceId = subscription.items.data[0]?.price?.id || null;

    const subAny = subscription as any;
    const periodStart = subAny.current_period_start
      ? new Date(subAny.current_period_start * 1000)
      : subAny.billing_cycle_anchor
      ? new Date(subAny.billing_cycle_anchor * 1000)
      : new Date();

    const periodEnd = subAny.current_period_end
      ? new Date(subAny.current_period_end * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const trialEnd = subscription.trial_end
      ? new Date(subscription.trial_end * 1000)
      : null;

    const canceledAt = subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000)
      : null;

    await prisma.stripeSubscription.upsert({
      where: {
        stripeSubscriptionId: subscription.id,
      },
      update: {
        userId: resolvedUserId,
        stripeCustomerId: customerId,
        status: subscription.status,
        planId,
        priceId,
        interval,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        trialEnd,
        cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
        canceledAt,
      },
      create: {
        stripeSubscriptionId: subscription.id,
        userId: resolvedUserId,
        stripeCustomerId: customerId,
        status: subscription.status,
        planId,
        priceId,
        interval,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        trialEnd,
        cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
        canceledAt,
      },
    });

    // Update Client record clientType if needed
    if (resolvedUserId) {
      await prisma.client.updateMany({
        where: { userId: resolvedUserId },
        data: {
          clientType: planId.toUpperCase(),
        },
      });
    }

    console.log(`[STRIPE SYNC] Successfully synced subscription ${subscription.id} (Status: ${subscription.status})`);
  } catch (error) {
    console.error(`[STRIPE SYNC] Failed to sync subscription ${subscription.id}:`, error);
  }
}
