"use server";

import { db } from "@/lib/db";
import { licenseKeys, profiles, organizations } from "@/lib/db/schema";
import { getCurrentUser } from "@/features/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import type { ActionResponse } from "@/lib/types";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    throw new Error("Unauthorized: Admin access required");
  }
  return user;
}

function generateLicenseKey(): string {
  const bytes = randomBytes(20);
  const hex = bytes.toString("hex").toUpperCase();
  return `305-${hex.slice(0, 5)}-${hex.slice(5, 10)}-${hex.slice(10, 15)}-${hex.slice(15, 20)}`;
}

export async function createLicenseKey(input: {
  email: string;
  plan: string;
  maxActivations?: number;
  expiresAt?: string;
}): Promise<ActionResponse> {
  await requireAdmin();

  const key = generateLicenseKey();

  const [license] = await db
    .insert(licenseKeys)
    .values({
      key,
      email: input.email,
      plan: input.plan,
      maxActivations: input.maxActivations ?? 1,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    })
    .returning();

  revalidatePath("/admin/licenses");
  return { success: true, data: license };
}

export async function revokeLicenseKey(licenseId: string): Promise<ActionResponse> {
  await requireAdmin();

  await db
    .update(licenseKeys)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(licenseKeys.id, licenseId));

  revalidatePath("/admin/licenses");
  return { success: true };
}

export async function deleteUser(userId: string): Promise<ActionResponse> {
  await requireAdmin();

  await db.delete(profiles).where(eq(profiles.id, userId));

  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteOrganization(orgId: string): Promise<ActionResponse> {
  await requireAdmin();

  await db.delete(organizations).where(eq(organizations.id, orgId));

  revalidatePath("/admin/organizations");
  return { success: true };
}
