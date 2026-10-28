import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import {
  stripe,
  isStripeConfigured,
  getPlanPriceId,
  getPlanPricingInfo,
  getOrCreateStripeCustomer,
} from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      planId = 'starter',
      billingPeriod = 'monthly',
      email: providedEmail,
    } = body;

    const session = await getServerSession();
    const effectiveEmail = session?.email || providedEmail;

    // Graceful handling if Stripe API key is not yet configured in .env
    if (!isStripeConfigured()) {
      console.info(
        '[STRIPE CHECKOUT] Stripe is not configured yet. Returning staging mock redirect.'
      );
      const fallbackUrl = `/connect?plan=${encodeURIComponent(
        planId
      )}&billing=${billingPeriod}&mock_checkout=true`;
      return NextResponse.json({
        ok: true,
        mock: true,
        url: fallbackUrl,
        message:
          'Stripe API key pending configuration. Redirected to onboarding.',
      });
    }

    const host =
      request.headers.get('origin') ||
      request.headers.get('host') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000';
    const origin = host.startsWith('http') ? host : `https://${host}`;

    // Resolve or create customer if email is available
    let customerId: string | null = null;
    if (effectiveEmail) {
      customerId = await getOrCreateStripeCustomer({
        userId: session?.userId,
        email: effectiveEmail,
        name: session?.tenantName,
      });
    }

    // Determine line item configuration
    const configuredPriceId = getPlanPriceId(planId, billingPeriod);

    let lineItems: any[];
    if (configuredPriceId) {
      lineItems = [
        {
          price: configuredPriceId,
          quantity: 1,
        },
      ];
    } else {
      // Dynamic fallback pricing if specific price IDs are omitted from .env
      const pricing = getPlanPricingInfo(planId, billingPeriod);
      lineItems = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: pricing.name,
              description: '14-Day Free Trial included. Cancel anytime.',
            },
            unit_amount: pricing.amount,
            recurring: {
              interval: pricing.interval,
            },
          },
          quantity: 1,
        },
      ];
    }

    // Build checkout session params
    const sessionParams: any = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: lineItems,
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          userId: session?.userId || '',
          clientId: session?.clientId || '',
          planId,
          billingPeriod,
        },
      },
      metadata: {
        userId: session?.userId || '',
        clientId: session?.clientId || '',
        planId,
        billingPeriod,
      },
      success_url: `${origin}/connect?plan=${encodeURIComponent(
        planId
      )}&session_id={CHECKOUT_SESSION_ID}&checkout_success=true`,
      cancel_url: `${origin}/pricing?checkout_canceled=true`,
      allow_promotion_codes: true,
    };

    if (customerId) {
      sessionParams.customer = customerId;
    } else if (effectiveEmail) {
      sessionParams.customer_email = effectiveEmail;
    }

    if (session?.userId) {
      sessionParams.client_reference_id = session.userId;
    }

    const checkoutSession = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({
      ok: true,
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error: any) {
    console.error('[STRIPE CHECKOUT] Error creating checkout session:', error);
    return NextResponse.json(
      {
        error: error?.message || 'Failed to initialize Stripe checkout session',
      },
      { status: 500 }
    );
  }
}

