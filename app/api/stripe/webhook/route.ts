import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe, syncStripeSubscription } from '@/lib/stripe';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let event: Stripe.Event;
  const sig = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  try {
    const rawBody = await request.text();

    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } else {
      // In development or when webhook secret is not set, parse payload directly
      console.warn('[STRIPE WEBHOOK] STRIPE_WEBHOOK_SECRET not configured. Verifying in bypass mode.');
      event = JSON.parse(rawBody) as Stripe.Event;
    }
  } catch (err: any) {
    console.error(`[STRIPE WEBHOOK] Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // 1. Audit event into stripe_webhook_events table
  try {
    await prisma.stripeWebhookEvent.upsert({
      where: { id: event.id },
      update: {
        type: event.type,
      },
      create: {
        id: event.id,
        type: event.type,
        receivedAt: new Date(),
      },
    });
  } catch (dbErr) {
    console.warn(`[STRIPE WEBHOOK] Could not persist event log for ${event.id}:`, dbErr);
  }

  // 2. Dispatch event to handlers
  let processingError: string | null = null;
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`[STRIPE WEBHOOK] Checkout session completed: ${session.id}`);

        if (session.subscription) {
          const subscriptionId =
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription.id;

          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await syncStripeSubscription(
            subscription,
            session.client_reference_id || session.metadata?.userId
          );
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[STRIPE WEBHOOK] Handling ${event.type} for subscription ${subscription.id}`);
        await syncStripeSubscription(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = (invoice as any).subscription;
        if (subId) {
          const subscriptionId = typeof subId === 'string' ? subId : subId.id;
          try {
            await prisma.stripeSubscription.updateMany({
              where: { stripeSubscriptionId: subscriptionId },
              data: { status: 'active', updatedAt: new Date() },
            });
          } catch (invErr) {
            console.warn('[STRIPE WEBHOOK] Invoice update note:', invErr);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = (invoice as any).subscription;
        if (subId) {
          const subscriptionId = typeof subId === 'string' ? subId : subId.id;
          try {
            await prisma.stripeSubscription.updateMany({
              where: { stripeSubscriptionId: subscriptionId },
              data: { status: 'past_due', updatedAt: new Date() },
            });
          } catch (invErr) {
            console.warn('[STRIPE WEBHOOK] Invoice payment_failed note:', invErr);
          }
        }
        break;
      }

      default:
        console.log(`[STRIPE WEBHOOK] Unhandled event type: ${event.type}`);
        break;
    }
  } catch (handlerErr: any) {
    processingError = handlerErr?.message || 'Processing error';
    console.error(`[STRIPE WEBHOOK] Error processing event ${event.id}:`, handlerErr);
  }

  // 3. Update processing status in audit log
  try {
    await prisma.stripeWebhookEvent.update({
      where: { id: event.id },
      data: {
        processedAt: new Date(),
        errorMessage: processingError,
      },
    });
  } catch (auditErr) {
    console.warn(`[STRIPE WEBHOOK] Could not update event completion status for ${event.id}:`, auditErr);
  }

  return NextResponse.json({ received: true });
}

