import { pgTable, text, timestamp, uuid, boolean, integer } from "drizzle-orm/pg-core";

export const licenseKeys = pgTable("license_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  email: text("email").notNull(),
  plan: text("plan").notNull(),
  maxActivations: integer("max_activations").notNull().default(1),
  currentActivations: integer("current_activations").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  metadata: text("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type LicenseKey = typeof licenseKeys.$inferSelect;
export type NewLicenseKey = typeof licenseKeys.$inferInsert;
