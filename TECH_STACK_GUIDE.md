# 305 Starter Kit — Tech Stack Deep Dive

Complete guide to understanding, debugging, and extending every technology in the stack.

---

## Table of Contents

1. [Next.js 15 (App Router)](#nextjs-15-app-router)
2. [Drizzle ORM](#drizzle-orm)
3. [Supabase Auth](#supabase-auth)
4. [Stripe Integration](#stripe-integration)
5. [Vercel AI SDK v6](#vercel-ai-sdk-v6)
6. [React Email + Resend](#react-email--resend)
7. [Tailwind CSS v4](#tailwind-css-v4)
8. [TypeScript Patterns](#typescript-patterns)

---

## Next.js 15 (App Router)

### What It Is
Next.js 15 uses the **App Router** (not Pages Router). Everything in `src/app/` is a route.

### Key Concepts

#### 1. File-Based Routing
```
src/app/
├── page.tsx              → /
├── (auth)/
│   ├── login/page.tsx    → /login
│   └── signup/page.tsx   → /signup
└── (dashboard)/
    └── dashboard/page.tsx → /dashboard
```

**Route Groups** `(auth)` and `(dashboard)` don't appear in URLs — they're for organization and shared layouts.

#### 2. Server Components vs Client Components

**Server Components (default):**
```tsx
// No "use client" directive
export default async function Page() {
  const data = await db.select().from(users); // Direct DB access
  return <div>{data.length} users</div>;
}
```

**Client Components:**
```tsx
"use client"; // Required for hooks, events, browser APIs

import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**When to use client components:**
- `useState`, `useEffect`, `useRouter`
- Event handlers (`onClick`, `onChange`)
- Browser APIs (`localStorage`, `window`)
- Third-party libraries that use hooks

#### 3. Server Actions

Server Actions let you call server-side functions from client components **without API routes**.

```tsx
// features/auth/lib/actions.ts
"use server"; // Makes all exports server-only

export async function updateProfile(input: UpdateProfileInput) {
  const user = await getCurrentUser();
  await db.update(profiles).set(input).where(eq(profiles.userId, user.id));
  revalidatePath("/dashboard"); // Clear Next.js cache
  return { success: true };
}
```

```tsx
// Client component calling it
"use client";

import { updateProfile } from "@/features/auth";

export function ProfileForm() {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await updateProfile({ fullName: "New Name" });
    // No fetch(), no API route needed
  };
}
```

**Key points:**
- Always validate input with Zod in Server Actions
- Use `revalidatePath()` or `revalidateTag()` to clear cache
- Return serializable data only (no functions, classes)

#### 4. Layouts

Layouts wrap pages and persist across navigation.

```tsx
// app/(dashboard)/layout.tsx
export default async function DashboardLayout({ children }) {
  const user = await getUser(); // Runs on server
  if (!user) redirect("/login");
  
  return (
    <DashboardShell user={user}>
      {children} {/* Page content renders here */}
    </DashboardShell>
  );
}
```

**Nested layouts:**
- Root layout (`app/layout.tsx`) wraps everything
- Route group layouts wrap their children
- Layouts don't re-render on navigation (performance win)

#### 5. Middleware

Runs **before** every request. Used for auth checks, redirects, session refresh.

```tsx
// src/middleware.ts
export async function middleware(request: NextRequest) {
  const { supabase, response } = await updateSession(request);
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

**Important:** Middleware runs on **every request**, so keep it fast. No heavy DB queries.

#### 6. API Routes

For webhooks, external APIs, or non-Server-Action endpoints.

```tsx
// app/api/webhooks/stripe/route.ts
export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  
  const event = stripe.webhooks.constructEvent(body, sig, secret);
  // Handle event
  
  return NextResponse.json({ received: true });
}
```

**When to use API routes vs Server Actions:**
- **API routes**: Webhooks, public APIs, file uploads
- **Server Actions**: Form submissions, mutations from client components

### Common Issues

**Issue:** "Error: Cannot read properties of undefined (reading 'map')"
**Cause:** Server Component trying to use client-only code
**Fix:** Add `"use client"` or move logic to Server Action

**Issue:** "Error: Functions cannot be passed directly to Client Components"
**Cause:** Passing a server function as a prop to a client component
**Fix:** Wrap in a Server Action or use API route

**Issue:** Page not updating after mutation
**Cause:** Next.js cache not invalidated
**Fix:** Call `revalidatePath("/your-page")` in Server Action

---

## Drizzle ORM

### What It Is
Type-safe SQL query builder. You write TypeScript, it generates SQL.

### Schema Definition

```tsx
// src/lib/db/schema/profiles.ts
import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Profile = typeof profiles.$inferSelect; // Type for reading
export type NewProfile = typeof profiles.$inferInsert; // Type for inserting
```

**Column types:**
- `text()` → VARCHAR
- `uuid()` → UUID
- `timestamp()` → TIMESTAMP
- `integer()` → INTEGER
- `boolean()` → BOOLEAN
- `jsonb()` → JSONB

### CRUD Operations

**Insert:**
```tsx
const [newProfile] = await db
  .insert(profiles)
  .values({ userId: "123", email: "user@example.com" })
  .returning(); // Returns inserted row
```

**Select:**
```tsx
// Get all
const allProfiles = await db.select().from(profiles);

// With where clause
const profile = await db
  .select()
  .from(profiles)
  .where(eq(profiles.userId, userId))
  .limit(1);

// Get first result
const [profile] = await db.select()...;
```

**Update:**
```tsx
await db
  .update(profiles)
  .set({ fullName: "New Name", updatedAt: new Date() })
  .where(eq(profiles.id, profileId));
```

**Delete:**
```tsx
await db.delete(profiles).where(eq(profiles.id, profileId));
```

### Joins

```tsx
// Inner join
const results = await db
  .select({
    profile: profiles,
    org: organizations,
  })
  .from(memberships)
  .innerJoin(profiles, eq(memberships.userId, profiles.userId))
  .innerJoin(organizations, eq(memberships.organizationId, organizations.id))
  .where(eq(profiles.userId, userId));
```

### Operators

```tsx
import { eq, ne, gt, gte, lt, lte, and, or, like, isNull } from "drizzle-orm";

// Equal
where(eq(profiles.email, "user@example.com"))

// Not equal
where(ne(profiles.status, "deleted"))

// Greater than
where(gt(profiles.createdAt, new Date("2024-01-01")))

// Multiple conditions (AND)
where(and(
  eq(profiles.userId, userId),
  eq(profiles.isActive, true)
))

// Multiple conditions (OR)
where(or(
  eq(profiles.role, "admin"),
  eq(profiles.role, "owner")
))

// Like (pattern matching)
where(like(profiles.email, "%@gmail.com"))

// Is null
where(isNull(profiles.deletedAt))
```

### Migrations

**Generate migration:**
```bash
npm run db:generate
# Creates SQL file in drizzle/ folder
```

**Run migrations:**
```bash
npm run db:migrate
# Applies pending migrations
```

**Push schema directly (dev only):**
```bash
npm run db:push
# Syncs schema without migration files
```

**Open Drizzle Studio:**
```bash
npm run db:studio
# Visual database browser at https://local.drizzle.studio
```

### Common Issues

**Issue:** "relation 'profiles' does not exist"
**Cause:** Schema not pushed to database
**Fix:** Run `npm run db:push`

**Issue:** Type error on `.where()`
**Cause:** Wrong operator or column type mismatch
**Fix:** Check import: `import { eq } from "drizzle-orm"`

**Issue:** Empty array returned instead of single object
**Cause:** Forgot to destructure result
**Fix:** `const [profile] = await db.select()...` or use `.limit(1)`

---

## Supabase Auth

### What It Is
Authentication service with built-in user management, OAuth, magic links, and session handling.

### Architecture

**Two clients:**
1. **Server client** (`lib/supabase/server.ts`) — for Server Components, Server Actions, API routes
2. **Browser client** (`lib/supabase/client.ts`) — for Client Components

### Server-Side Auth

```tsx
// Server Component or Server Action
import { createClient } from "@/lib/supabase/server";

export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
```

**Why `await createClient()`?**
- Reads cookies from Next.js headers (async in Next.js 15)
- Creates a fresh client per request

### Client-Side Auth

```tsx
// Client Component
"use client";

import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const supabase = createClient(); // No await
  
  const handleLogin = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
  };
}
```

### Auth Methods

**Email/Password Signup:**
```tsx
const { data, error } = await supabase.auth.signUp({
  email: "user@example.com",
  password: "securepassword",
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
});
```

**Email/Password Login:**
```tsx
const { data, error } = await supabase.auth.signInWithPassword({
  email: "user@example.com",
  password: "securepassword",
});
```

**OAuth (Google, GitHub, etc.):**
```tsx
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
});
```

**Sign Out:**
```tsx
await supabase.auth.signOut();
router.push("/");
router.refresh(); // Clear Next.js cache
```

### Session Management

**Middleware refreshes sessions automatically:**
```tsx
// src/lib/supabase/middleware.ts
export async function updateSession(request: NextRequest) {
  const supabase = createServerClient(/* ... */);
  await supabase.auth.getUser(); // Refreshes session if needed
  return { supabase, response };
}
```

**Check auth in layouts:**
```tsx
// app/(dashboard)/layout.tsx
export default async function DashboardLayout({ children }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect("/login");
  
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
```

### User Metadata

**Set during signup:**
```tsx
await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: "John Doe",
      business_name: "Acme Corp",
    },
  },
});
```

**Access in user object:**
```tsx
const user = await supabase.auth.getUser();
console.log(user.user_metadata.full_name);
```

### Common Issues

**Issue:** "Auth session missing" in Server Component
**Cause:** Using browser client instead of server client
**Fix:** Import from `@/lib/supabase/server`, not `client`

**Issue:** User logged in but redirected to login
**Cause:** Middleware not running or cookies not being set
**Fix:** Check `middleware.ts` config matcher, ensure cookies are allowed

**Issue:** OAuth redirect not working
**Cause:** Callback URL not configured in Supabase dashboard
**Fix:** Add `https://yourdomain.com/auth/callback` to Supabase Auth settings

---

## Stripe Integration

### What It Is
Payment processing for subscriptions. Handles billing, invoices, and payment methods.

### Architecture

**Flow:**
1. User clicks "Subscribe" → Server Action creates Checkout Session
2. User redirected to Stripe Checkout (hosted page)
3. User completes payment → Stripe sends webhook to your app
4. Webhook handler updates database with subscription status

### Creating Checkout Session

```tsx
// features/billing/lib/actions.ts
export async function createCheckoutSession(priceId: string) {
  const user = await getCurrentUser();
  const org = await getOwnedOrganization(user.id);
  
  // Create or get Stripe Customer
  let customerId = org.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { org_id: org.id },
    });
    customerId = customer.id;
    await db.update(organizations).set({ stripeCustomerId: customerId });
  }
  
  // Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/billing?success=true`,
    cancel_url: `${appUrl}/dashboard/billing?canceled=true`,
    metadata: { org_id: org.id }, // Important for webhook
  });
  
  redirect(session.url); // Redirect to Stripe
}
```

### Customer Portal

Stripe-hosted page for managing subscriptions, payment methods, invoices.

```tsx
export async function createPortalSession() {
  const org = await getOwnedOrganization(user.id);
  
  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: `${appUrl}/dashboard/billing`,
  });
  
  redirect(session.url);
}
```

### Webhook Handler

**Critical:** Webhooks are how you know when subscriptions change.

```tsx
// app/api/webhooks/stripe/route.ts
export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  
  // Verify webhook signature
  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );
  
  switch (event.type) {
    case "checkout.session.completed":
      // User completed payment
      const session = event.data.object;
      const orgId = session.metadata.org_id;
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      
      await db.update(organizations).set({
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0].price.id,
        stripeSubscriptionStatus: subscription.status,
      }).where(eq(organizations.id, orgId));
      break;
      
    case "customer.subscription.updated":
      // Plan changed or payment method updated
      const sub = event.data.object;
      await db.update(organizations).set({
        stripePriceId: sub.items.data[0].price.id,
        stripeSubscriptionStatus: sub.status,
      }).where(eq(organizations.stripeSubscriptionId, sub.id));
      break;
      
    case "customer.subscription.deleted":
      // Subscription canceled
      await db.update(organizations).set({
        stripeSubscriptionStatus: "canceled",
      }).where(eq(organizations.stripeSubscriptionId, event.data.object.id));
      break;
  }
  
  return NextResponse.json({ received: true });
}
```

### Testing Webhooks Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copy the webhook signing secret (whsec_...) to .env as STRIPE_WEBHOOK_SECRET
```

### Subscription Gating

Check if user has active subscription:

```tsx
import { checkSubscription } from "@/features/billing";

export default async function ProtectedPage() {
  const user = await getCurrentUser();
  const { hasSubscription } = await checkSubscription(user.id);
  
  if (!hasSubscription) {
    redirect("/dashboard/billing");
  }
  
  return <PremiumFeature />;
}
```

### Common Issues

**Issue:** Webhook returns 400 "Invalid signature"
**Cause:** Wrong webhook secret or body not raw text
**Fix:** Use `await req.text()` not `await req.json()`, verify `STRIPE_WEBHOOK_SECRET`

**Issue:** Subscription created but database not updated
**Cause:** Webhook not configured or metadata missing
**Fix:** Check Stripe Dashboard → Webhooks, ensure `org_id` in metadata

**Issue:** User charged but subscription shows as inactive
**Cause:** Webhook handler error or event not handled
**Fix:** Check webhook logs in Stripe Dashboard, add error logging

---

## Vercel AI SDK v6

### What It Is
Framework for building AI features. Handles streaming, tool calling, and multi-turn conversations.

### Architecture

**Two parts:**
1. **API route** (`app/api/chat/route.ts`) — streams AI responses
2. **Client component** (`features/ai/components/chat-interface.tsx`) — displays chat UI

### API Route (Server)

```tsx
// app/api/chat/route.ts
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(req: Request) {
  const { messages } = await req.json();
  
  const result = streamText({
    model: openai("gpt-4"),
    messages,
    system: "You are a helpful assistant.",
  });
  
  return result.toDataStreamResponse();
}
```

### Client Component

```tsx
"use client";

import { useChat } from "ai/react";

export function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
  });
  
  return (
    <div>
      {messages.map((m) => (
        <div key={m.id}>
          <strong>{m.role}:</strong> {m.content}
        </div>
      ))}
      
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
        <button type="submit" disabled={isLoading}>Send</button>
      </form>
    </div>
  );
}
```

### Message Format

```tsx
type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};
```

### Swapping Models

**OpenAI:**
```tsx
import { openai } from "@ai-sdk/openai";
const model = openai("gpt-4");
```

**Anthropic:**
```tsx
import { anthropic } from "@ai-sdk/anthropic";
const model = anthropic("claude-3-5-sonnet-20241022");
```

**Google:**
```tsx
import { google } from "@ai-sdk/google";
const model = google("gemini-pro");
```

### Common Issues

**Issue:** "useChat is not a function"
**Cause:** Wrong import path
**Fix:** Import from `ai/react` not `ai`

**Issue:** Streaming not working, full response appears at once
**Cause:** API route not returning stream
**Fix:** Use `result.toDataStreamResponse()` not `NextResponse.json()`

**Issue:** Messages not persisting across page refresh
**Cause:** No database storage
**Fix:** Add message storage in webhook or use `onFinish` callback

---

## React Email + Resend

### What It Is
- **React Email**: Build email templates with React components
- **Resend**: Send transactional emails

### Email Template

```tsx
// features/email/templates/welcome.tsx
import { Html, Head, Body, Container, Heading, Text, Link } from "@react-email/components";

export function WelcomeEmail({ userName, appUrl }) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#0f172a" }}>
        <Container>
          <Heading style={{ color: "#e2b340" }}>
            Welcome, {userName}!
          </Heading>
          <Text style={{ color: "#e2e8f0" }}>
            Thanks for signing up.
          </Text>
          <Link href={`${appUrl}/dashboard`}>
            Go to Dashboard
          </Link>
        </Container>
      </Body>
    </Html>
  );
}
```

### Sending Emails

```tsx
// features/email/lib/send-emails.ts
"use server";

import { sendEmail } from "@/lib/email";
import { WelcomeEmail } from "../templates/welcome";

export async function sendWelcomeEmail(to: string, userName: string) {
  return sendEmail({
    to,
    subject: "Welcome to 305 Starter Kit",
    react: WelcomeEmail({ userName, appUrl: process.env.NEXT_PUBLIC_APP_URL }),
  });
}
```

### Resend Client

```tsx
// lib/email/index.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, react }) {
  const { data, error } = await resend.emails.send({
    from: "Your App <onboarding@resend.dev>",
    to: Array.isArray(to) ? to : [to],
    subject,
    react,
  });
  
  if (error) throw new Error(error.message);
  return data;
}
```

### Testing Emails Locally

**Option 1: Resend Test Mode**
- Emails sent to any address are captured in Resend dashboard
- No actual delivery

**Option 2: Preview in Browser**
```bash
npx react-email dev
# Opens http://localhost:3000 with email previews
```

### Common Issues

**Issue:** "API key not found"
**Cause:** `RESEND_API_KEY` not set
**Fix:** Get key from resend.com, add to `.env`

**Issue:** Email sent but not received
**Cause:** Domain not verified or test mode enabled
**Fix:** Verify domain in Resend dashboard, check spam folder

---

## Tailwind CSS v4

### What It Is
Utility-first CSS framework. Write classes directly in JSX.

### Custom Theme (Miami Premium)

```css
/* src/app/globals.css */
@theme inline {
  --color-primary: oklch(0.80 0.15 85);      /* Gold */
  --color-secondary: oklch(0.70 0.14 195);   /* Turquoise */
  --color-background: oklch(0.10 0.01 264);  /* Slate-950 */
}
```

### Common Utilities

```tsx
// Layout
<div className="flex items-center justify-between gap-4">

// Spacing
<div className="p-4 mx-auto max-w-6xl">

// Typography
<h1 className="text-3xl font-bold tracking-tight">

// Colors
<button className="bg-primary text-primary-foreground">

// Borders & Radius
<div className="rounded-lg border border-border">

// Hover & Focus
<button className="hover:bg-accent focus:ring-2 focus:ring-ring">
```

### Custom Utilities

```css
/* globals.css */
@layer utilities {
  .text-gradient-miami {
    @apply bg-linear-to-r from-primary via-secondary to-success bg-clip-text text-transparent;
  }
  
  .glass-panel {
    @apply bg-card/60 backdrop-blur-xl border border-border/50 rounded-xl;
  }
}
```

### Responsive Design

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* 1 column on mobile, 2 on tablet, 3 on desktop */}
</div>
```

---

## TypeScript Patterns

### Zod Validation

```tsx
import { z } from "zod";

const createOrgSchema = z.object({
  name: z.string().min(2).max(50),
  slug: z.string().regex(/^[a-z0-9-]+$/),
});

type CreateOrgInput = z.infer<typeof createOrgSchema>;

export async function createOrg(input: CreateOrgInput) {
  const parsed = createOrgSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }
  // Use parsed.data (validated)
}
```

### Type Inference from Drizzle

```tsx
import { profiles } from "@/lib/db/schema";

type Profile = typeof profiles.$inferSelect;
type NewProfile = typeof profiles.$inferInsert;

// Now you have types without manual definitions
```

### ActionResponse Pattern

```tsx
export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function myAction(): Promise<ActionResponse<Organization>> {
  try {
    const org = await createOrg();
    return { success: true, data: org };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
```

---

## Quick Reference

### File Locations Cheat Sheet

| What | Where |
|------|-------|
| Database schema | `src/lib/db/schema/` |
| Server Actions | `features/*/lib/actions.ts` |
| DB queries | `features/*/lib/queries.ts` |
| UI components | `features/*/components/` |
| Shared UI | `src/components/ui/` |
| API routes | `src/app/api/*/route.ts` |
| Pages | `src/app/(group)/path/page.tsx` |
| Layouts | `src/app/(group)/layout.tsx` |
| Middleware | `src/middleware.ts` |

### Environment Variables

| Variable | Used By | Required |
|----------|---------|----------|
| `DATABASE_URL` | Drizzle | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | Yes |
| `STRIPE_SECRET_KEY` | Stripe | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhooks | Yes |
| `OPENAI_API_KEY` | AI SDK | Yes |
| `RESEND_API_KEY` | Resend | For emails |
| `ADMIN_EMAILS` | Admin panel | For admin |

### Common Commands

```bash
# Development
npm run dev

# Build
npm run build

# Database
npm run db:push        # Sync schema (dev)
npm run db:generate    # Create migration
npm run db:migrate     # Run migrations
npm run db:studio      # Open GUI

# Stripe
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
