import { db } from "@/lib/db";
import { profiles, memberships, organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getProfileByUserId(userId: string) {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  return profile ?? null;
}

export async function getUserOrganizations(userId: string) {
  const results = await db
    .select({
      membership: memberships,
      organization: organizations,
    })
    .from(memberships)
    .innerJoin(organizations, eq(memberships.organizationId, organizations.id))
    .where(eq(memberships.userId, userId));

  return results;
}

export async function getUserMembershipForOrg(
  userId: string,
  organizationId: string
) {
  const [membership] = await db
    .select()
    .from(memberships)
    .where(eq(memberships.userId, userId))
    .limit(1);

  if (membership && membership.organizationId === organizationId) {
    return membership;
  }

  return null;
}
