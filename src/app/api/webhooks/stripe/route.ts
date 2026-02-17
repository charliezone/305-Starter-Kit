import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const orgId = session.metadata?.org_id;
  if (!orgId) return;

  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );

  await db
    .update(organizations)
    .set({
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price?.id ?? null,
      stripeSubscriptionStatus: subscription.status,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, orgId));
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const orgId = subscription.metadata?.org_id;
  if (!orgId) return;

  await db
    .update(organizations)
    .set({
      stripePriceId: subscription.items.data[0]?.price?.id ?? null,
      stripeSubscriptionStatus: subscription.status,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, orgId));
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const orgId = subscription.metadata?.org_id;
  if (!orgId) return;

  await db
    .update(organizations)
    .set({
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeSubscriptionStatus: "canceled",
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, orgId));
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subRef = invoice.parent?.subscription_details?.subscription;
  if (!subRef) return;

  const subscriptionId = typeof subRef === "string" ? subRef : subRef.id;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const orgId = subscription.metadata?.org_id;
  if (!orgId) return;

  await db
    .update(organizations)
    .set({
      stripeSubscriptionStatus: "past_due",
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, orgId));
}

export async function POST(req: Request) {
  const body = await req.text();
  const headerStore = await headers();
  const signature = headerStore.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${message}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook handler error for ${event.type}: ${message}`);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
