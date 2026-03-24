"use server";

import { db } from "@/lib/db";
import { profiles, organizations, memberships } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import {
  createOrganizationSchema,
  updateProfileSchema,
  type ActionResponse,
  type CreateOrganizationInput,
  type UpdateProfileInput,
} from "@/lib/types";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function ensureUserSetup(userId: string, email: string) {
  const [existingProfile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  if (existingProfile) return;

  await db.insert(profiles).values({
    userId,
    email,
    fullName: email.split("@")[0],
  });

  const slug =
    email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 30) +
    "-" +
    userId.slice(0, 8);

  const [org] = await db
    .insert(organizations)
    .values({
      name: `${email.split("@")[0]}'s Workspace`,
      slug,
    })
    .returning();

  await db.insert(memberships).values({
    userId,
    organizationId: org.id,
    role: "owner",
  });
}

export async function updateProfile(
  input: UpdateProfileInput
): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  await db
    .update(profiles)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(profiles.userId, user.id));

  revalidatePath("/dashboard");
  return { success: true };
}

export async function createOrganization(
  input: CreateOrganizationInput
): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = createOrganizationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  const [org] = await db
    .insert(organizations)
    .values({
      name: parsed.data.name,
      slug: parsed.data.slug,
    })
    .returning();

  await db.insert(memberships).values({
    userId: user.id,
    organizationId: org.id,
    role: "owner",
  });

  revalidatePath("/dashboard");
  return { success: true, data: org };
}
