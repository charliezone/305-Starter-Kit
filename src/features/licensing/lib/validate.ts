import { db } from "@/lib/db";
import { licenseKeys } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface LicenseValidationResult {
  valid: boolean;
  plan?: string;
  message: string;
}

export async function validateLicenseKey(
  key: string
): Promise<LicenseValidationResult> {
  const [license] = await db
    .select()
    .from(licenseKeys)
    .where(eq(licenseKeys.key, key))
    .limit(1);

  if (!license) {
    return { valid: false, message: "License key not found" };
  }

  if (!license.isActive) {
    return { valid: false, message: "License key has been revoked" };
  }

  if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
    return { valid: false, message: "License key has expired" };
  }

  if (license.currentActivations >= license.maxActivations) {
    return {
      valid: false,
      message: `Maximum activations reached (${license.maxActivations})`,
    };
  }

  return {
    valid: true,
    plan: license.plan,
    message: "License key is valid",
  };
}

export async function activateLicenseKey(
  key: string
): Promise<LicenseValidationResult> {
  const validation = await validateLicenseKey(key);
  if (!validation.valid) return validation;

  await db
    .update(licenseKeys)
    .set({
      currentActivations: (
        await db
          .select({ val: licenseKeys.currentActivations })
          .from(licenseKeys)
          .where(eq(licenseKeys.key, key))
          .limit(1)
      )[0].val + 1,
      updatedAt: new Date(),
    })
    .where(eq(licenseKeys.key, key));

  return {
    valid: true,
    plan: validation.plan,
    message: "License key activated successfully",
  };
}
