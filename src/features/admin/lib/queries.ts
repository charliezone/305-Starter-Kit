"use server";

import { db } from "@/lib/db";
import { profiles, organizations, memberships, licenseKeys } from "@/lib/db/schema";
import { count, desc, eq, sql } from "drizzle-orm";

export async function getAdminMetrics() {
  const [userCount] = await db.select({ value: count() }).from(profiles);
  const [orgCount] = await db.select({ value: count() }).from(organizations);
  const [licenseCount] = await db.select({ value: count() }).from(licenseKeys);

  const [activeSubCount] = await db
    .select({ value: count() })
    .from(organizations)
    .where(eq(organizations.stripeSubscriptionStatus, "active"));

  return {
    totalUsers: userCount.value,
    totalOrganizations: orgCount.value,
    totalLicenses: licenseCount.value,
    activeSubscriptions: activeSubCount.value,
  };
}

export async function getAdminUsers(page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize;

  const users = await db
    .select()
    .from(profiles)
    .orderBy(desc(profiles.createdAt))
    .limit(pageSize)
    .offset(offset);

  const [totalResult] = await db.select({ value: count() }).from(profiles);

  return {
    items: users,
    total: totalResult.value,
    page,
    pageSize,
    hasMore: offset + pageSize < totalResult.value,
  };
}

export async function getAdminOrganizations(page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize;

  const orgs = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      stripeSubscriptionStatus: organizations.stripeSubscriptionStatus,
      stripePriceId: organizations.stripePriceId,
      createdAt: organizations.createdAt,
      memberCount: sql<number>`(
        SELECT count(*)::int FROM ${memberships}
        WHERE ${memberships.organizationId} = ${organizations.id}
      )`,
    })
    .from(organizations)
    .orderBy(desc(organizations.createdAt))
    .limit(pageSize)
    .offset(offset);

  const [totalResult] = await db.select({ value: count() }).from(organizations);

  return {
    items: orgs,
    total: totalResult.value,
    page,
    pageSize,
    hasMore: offset + pageSize < totalResult.value,
  };
}

export async function getAdminLicenseKeys(page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize;

  const keys = await db
    .select()
    .from(licenseKeys)
    .orderBy(desc(licenseKeys.createdAt))
    .limit(pageSize)
    .offset(offset);

  const [totalResult] = await db.select({ value: count() }).from(licenseKeys);

  return {
    items: keys,
    total: totalResult.value,
    page,
    pageSize,
    hasMore: offset + pageSize < totalResult.value,
  };
}
