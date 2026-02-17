import { db } from "@/lib/db";
import { organizations, memberships } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isActiveSubscription } from "./plans";

export interface SubscriptionGuardResult {
  hasSubscription: boolean;
  status: string | null;
  planId: string | null;
  organizationId: string | null;
}

export async function checkSubscription(
  userId: string
): Promise<SubscriptionGuardResult> {
  const results = await db
    .select({
      orgId: organizations.id,
      status: organizations.stripeSubscriptionStatus,
      priceId: organizations.stripePriceId,
    })
    .from(memberships)
    .innerJoin(organizations, eq(memberships.organizationId, organizations.id))
    .where(eq(memberships.userId, userId))
    .limit(1);

  const org = results[0];

  if (!org) {
    return {
      hasSubscription: false,
      status: null,
      planId: null,
      organizationId: null,
    };
  }

  return {
    hasSubscription: isActiveSubscription(org.status),
    status: org.status,
    planId: org.priceId,
    organizationId: org.orgId,
  };
}
