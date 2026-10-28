import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { stripe, isStripeConfigured, isValidUuid, getOrCreateStripeCustomer } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const host =
      request.headers.get('origin') ||
      request.headers.get('host') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000';
    const origin = host.startsWith('http') ? host : `https://${host}`;

    // Graceful handling if Stripe is not yet configured
    if (!isStripeConfigured()) {
      return NextResponse.json({
        ok: false,
        mock: true,
        message: 'Stripe API keys are pending configuration in .env. Customer billing portal will be active once configured.',
        url: `${origin}/settings?billing_notice=unconfigured`,
      });
    }

    let customerId: string | null = null;

    // Look up customer in local database
    if (isValidUuid(session.userId)) {
      const dbCust = await prisma.stripeCustomer.findUnique({
        where: { userId: session.userId },
      });
      if (dbCust?.stripeCustomerId) {
        customerId = dbCust.stripeCustomerId;
      }
    }

    if (!customerId && session.email) {
      const dbCustByEmail = await prisma.stripeCustomer.findFirst({
        where: { email: session.email.trim().toLowerCase() },
      });
      if (dbCustByEmail?.stripeCustomerId) {
        customerId = dbCustByEmail.stripeCustomerId;
      }
    }

    // If still not found, retrieve or create customer in Stripe
    if (!customerId && session.email) {
      customerId = await getOrCreateStripeCustomer({
        userId: session.userId,
        email: session.email,
        name: session.tenantName,
      });
    }

    if (!customerId) {
      return NextResponse.json(
        {
          error: 'No active Stripe billing profile found for this account. Subscribe to a plan first.',
        },
        { status: 404 }
      );
    }

    // Create Stripe Customer Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/settings`,
    });

    return NextResponse.json({
      ok: true,
      url: portalSession.url,
    });
  } catch (error: any) {
    console.error('[STRIPE PORTAL] Error creating portal session:', error);
    return NextResponse.json(
      {
        error: error?.message || 'Failed to initialize Stripe customer billing portal',
      },
      { status: 500 }
    );
  }
}

