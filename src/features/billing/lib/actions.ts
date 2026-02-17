"use server";

import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { organizations, memberships } from "@/lib/db/schema";
import { getCurrentUser } from "@/features/auth";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import type { ActionResponse } from "@/lib/types";

async function getOwnedOrganization(userId: string) {
  const [result] = await db
    .select({ org: organizations })
    .from(memberships)
    .innerJoin(organizations, eq(memberships.organizationId, organizations.id))
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.role, "owner")
      )
    )
    .limit(1);

  return result?.org ?? null;
}

export async function createCheckoutSession(priceId: string): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const org = await getOwnedOrganization(user.id);
  if (!org) return { success: false, error: "No organization found" };

  let stripeCustomerId = org.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: {
        org_id: org.id,
        user_id: user.id,
      },
    });
    stripeCustomerId = customer.id;

    await db
      .update(organizations)
      .set({ stripeCustomerId: customer.id, updatedAt: new Date() })
      .where(eq(organizations.id, org.id));
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/billing?success=true`,
    cancel_url: `${appUrl}/dashboard/billing?canceled=true`,
    subscription_data: {
      metadata: {
        org_id: org.id,
      },
    },
    metadata: {
      org_id: org.id,
    },
  });

  if (session.url) {
    redirect(session.url);
  }

  return { success: false, error: "Failed to create checkout session" };
}

export async function createPortalSession(): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const org = await getOwnedOrganization(user.id);
  if (!org?.stripeCustomerId) {
    return { success: false, error: "No billing account found" };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: `${appUrl}/dashboard/billing`,
  });

  if (session.url) {
    redirect(session.url);
  }

  return { success: false, error: "Failed to create portal session" };
}

export async function getSubscriptionStatus() {
  const user = await getCurrentUser();
  if (!user) return null;

  const org = await getOwnedOrganization(user.id);
  if (!org) return null;

  return {
    organizationId: org.id,
    organizationName: org.name,
    stripeCustomerId: org.stripeCustomerId,
    stripeSubscriptionId: org.stripeSubscriptionId,
    stripePriceId: org.stripePriceId,
    stripeSubscriptionStatus: org.stripeSubscriptionStatus,
  };
}
