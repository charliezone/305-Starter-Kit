# Component Architecture Guide

Complete breakdown of every component, its purpose, dependencies, and how to modify it.

---

## Table of Contents

1. [Feature Modules Overview](#feature-modules-overview)
2. [Auth Feature](#auth-feature)
3. [Billing Feature](#billing-feature)
4. [AI Feature](#ai-feature)
5. [Admin Feature](#admin-feature)
6. [Email Feature](#email-feature)
7. [Dashboard Feature](#dashboard-feature)
8. [Licensing Feature](#licensing-feature)
9. [Shared UI Components](#shared-ui-components)

---

## Feature Modules Overview

### Architecture Pattern

Every feature follows this structure:

```
features/feature-name/
├── components/          # React components (UI)
│   ├── component-a.tsx
│   └── component-b.tsx
├── lib/
│   ├── actions.ts      # Server Actions (mutations)
│   ├── queries.ts      # Database queries (reads)
│   └── utils.ts        # Feature-specific utilities
└── index.ts            # Barrel export (public API)
```

**Why this structure?**
- **Encapsulation**: Everything related to a feature lives together
- **Clear boundaries**: `index.ts` defines what's public
- **Easy to find**: Need billing logic? Look in `features/billing/`
- **Scalable**: Add new features without touching existing ones

### Import Pattern

```tsx
// ✅ Good: Import from barrel
import { createCheckoutSession, PricingCards } from "@/features/billing";

// ❌ Bad: Import from internal files
import { createCheckoutSession } from "@/features/billing/lib/actions";
```

---

## Auth Feature

**Location:** `src/features/auth/`

### Purpose
Handles user authentication, profile management, and organization creation.

### Files

#### `lib/actions.ts` — Server Actions

**`getCurrentUser()`**
```tsx
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
```
- **When to use**: Any Server Component or Server Action that needs user info
- **Returns**: Supabase User object or null
- **Example**: `const user = await getCurrentUser(); if (!user) redirect("/login");`

**`updateProfile(input: UpdateProfileInput)`**
```tsx
export async function updateProfile(input: UpdateProfileInput) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };
  
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.message };
  
  await db.update(profiles).set(parsed.data).where(eq(profiles.userId, user.id));
  revalidatePath("/dashboard");
  return { success: true };
}
```
- **When to use**: User wants to update their name or avatar
- **Input**: `{ fullName?: string, avatarUrl?: string }`
- **Returns**: `ActionResponse`
- **Side effects**: Invalidates `/dashboard` cache

**`createOrganization(input: CreateOrganizationInput)`**
```tsx
export async function createOrganization(input: CreateOrganizationInput) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };
  
  const parsed = createOrganizationSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.message };
  
  const [org] = await db.insert(organizations).values(parsed.data).returning();
  await db.insert(memberships).values({
    userId: user.id,
    organizationId: org.id,
    role: "owner",
  });
  
  revalidatePath("/dashboard");
  return { success: true, data: org };
}
```
- **When to use**: User creates a new organization
- **Input**: `{ name: string, slug: string }`
- **Returns**: `ActionResponse<Organization>`
- **Side effects**: Creates org + membership, invalidates cache

#### `lib/queries.ts` — Database Queries

**`getProfileByUserId(userId: string)`**
- Fetches user profile from database
- Returns: `Profile | null`

**`getUserOrganizations(userId: string)`**
- Gets all orgs user belongs to via memberships
- Returns: `Array<{ org: Organization, membership: Membership }>`

**`getUserMembershipForOrg(userId: string, orgId: string)`**
- Gets user's role in specific org
- Returns: `Membership | null`

#### `components/login-form.tsx` — Login Form

**Purpose:** Client-side login form with email/password

**Key Features:**
- Form validation
- Error handling
- Loading states
- Redirect after success

**How it works:**
```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError(null);
  
  const supabase = createClient(); // Browser client
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) {
    setError(error.message);
    setIsLoading(false);
  } else {
    router.push("/dashboard");
    router.refresh(); // Clear Next.js cache
  }
};
```

**Customization:**
- Add OAuth buttons: Use `supabase.auth.signInWithOAuth({ provider: "google" })`
- Add "Remember me": Store preference in localStorage
- Add magic link: Use `supabase.auth.signInWithOtp({ email })`

#### `components/signup-form.tsx` — Signup Form

**Purpose:** Client-side signup form with email/password

**Key Features:**
- Password confirmation
- Email verification flow
- Terms acceptance checkbox
- Redirect to email confirmation page

**How it works:**
```tsx
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
});

if (data?.user?.identities?.length === 0) {
  setError("Email already registered");
} else if (!error) {
  setMessage("Check your email to confirm your account");
}
```

**Customization:**
- Add user metadata: Pass `options.data: { full_name, business_name }`
- Skip email verification: Disable in Supabase dashboard (not recommended)
- Auto-create profile: Add Server Action call after signup

### Common Modifications

**Auto-create organization on signup:**

1. Modify `signup-form.tsx`:
```tsx
const { data, error } = await supabase.auth.signUp({ email, password });

if (data.user) {
  // Call Server Action to create org
  await createOrganization({
    name: businessName,
    slug: generateSlug(businessName),
  });
}
```

2. Or use Supabase Database Webhook:
- Trigger on `auth.users` insert
- Call your API to create profile + org

**Add OAuth providers:**

1. Enable in Supabase dashboard (Authentication → Providers)
2. Add button to login form:
```tsx
<button onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}>
  Sign in with Google
</button>
```

---

## Billing Feature

**Location:** `src/features/billing/`

### Purpose
Handles Stripe subscriptions, pricing, checkout, and subscription status.

### Files

#### `lib/plans.ts` — Plan Definitions

**Purpose:** Central source of truth for pricing plans

```tsx
export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 29,
    interval: "month",
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER,
    features: [
      { text: "Up to 3 team members", included: true },
      { text: "5 GB storage", included: true },
      // ...
    ],
  },
  // ...
];
```

**How to modify:**
1. Change prices: Update `price` field
2. Add features: Add to `features` array
3. Add new plan: Add new object to `PLANS` array
4. Create Price in Stripe Dashboard → Copy Price ID to `.env`

**Helper functions:**
- `getPlanByPriceId(priceId)` — Find plan by Stripe Price ID
- `getPlanById(planId)` — Find plan by internal ID
- `isActiveSubscription(status)` — Check if status is active/trialing

#### `lib/actions.ts` — Billing Actions

**`createCheckoutSession(priceId: string)`**

**Flow:**
1. Get current user and their owned organization
2. Create or retrieve Stripe Customer
3. Store Customer ID in database
4. Create Checkout Session with metadata
5. Redirect to Stripe Checkout

**Key points:**
- `metadata: { org_id }` is critical for webhook
- `customer` links subscription to org
- `success_url` and `cancel_url` for redirects

**`createPortalSession()`**

**Flow:**
1. Get user's organization
2. Verify Stripe Customer exists
3. Create Portal Session
4. Redirect to Stripe Portal

**Purpose:** Let users manage their subscription (cancel, update payment, view invoices)

**`getSubscriptionStatus()`**

**Returns:**
```tsx
{
  organizationId: string;
  organizationName: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  stripeSubscriptionStatus: string | null;
}
```

**When to use:** Display current subscription in UI

#### `lib/subscription-guard.ts` — Access Control

**`checkSubscription(userId: string)`**

**Returns:**
```tsx
{
  hasSubscription: boolean;
  status: string | null;
  planId: string | null;
  organizationId: string | null;
}
```

**Usage in pages:**
```tsx
export default async function PremiumFeaturePage() {
  const user = await getCurrentUser();
  const { hasSubscription } = await checkSubscription(user.id);
  
  if (!hasSubscription) {
    return <UpgradePrompt />;
  }
  
  return <PremiumFeature />;
}
```

#### `components/pricing-cards.tsx` — Pricing UI

**Purpose:** Display all plans with subscribe buttons

**Features:**
- Highlights "Most Popular" plan
- Shows current plan as disabled
- Loading states during checkout
- Feature comparison

**How it works:**
```tsx
const handleSubscribe = () => {
  startTransition(async () => {
    await createCheckoutSession(plan.stripePriceId);
    // User redirected to Stripe
  });
};
```

**Customization:**
- Change layout: Modify grid classes
- Add annual billing: Duplicate plans with `interval: "year"`
- Add trial period: Configure in Stripe Dashboard

#### `components/billing-status.tsx` — Current Subscription

**Purpose:** Show user's current plan and manage button

**Displays:**
- Plan name and price
- Subscription status badge
- "Manage Billing" button → Stripe Portal

**Customization:**
- Add usage metrics: Query from database, display alongside plan
- Add upgrade CTA: Show if on lower tier

### Webhook Handler

**Location:** `src/app/api/webhooks/stripe/route.ts`

**Critical events:**

**`checkout.session.completed`**
- User completed payment
- Extract `org_id` from metadata
- Retrieve subscription details
- Update database with subscription info

**`customer.subscription.updated`**
- Plan changed or payment method updated
- Update `stripePriceId` and `stripeSubscriptionStatus`

**`customer.subscription.deleted`**
- User canceled subscription
- Set status to "canceled"
- Clear subscription IDs

**`invoice.payment_failed`**
- Payment failed (card declined, expired)
- Set status to "past_due"
- Trigger email notification (add this)

**Debugging webhooks:**
```bash
# Local testing
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Check logs
stripe logs tail

# Resend webhook
stripe events resend evt_xxx
```

### Common Modifications

**Add usage-based billing:**

1. Track usage in database:
```tsx
const usageTable = pgTable("usage", {
  orgId: uuid("org_id").references(() => organizations.id),
  metric: text("metric"), // e.g., "api_calls"
  count: integer("count"),
  month: text("month"), // "2024-01"
});
```

2. Report to Stripe:
```tsx
await stripe.subscriptionItems.createUsageRecord(
  subscriptionItemId,
  { quantity: apiCallCount, timestamp: "now" }
);
```

**Add trial period:**

1. In Stripe Dashboard → Product → Add trial period (e.g., 14 days)
2. Checkout automatically includes trial
3. Webhook `checkout.session.completed` will have `status: "trialing"`

**Add coupon codes:**

```tsx
const session = await stripe.checkout.sessions.create({
  // ...
  discounts: [{ coupon: "LAUNCH50" }], // 50% off
});
```

---

## AI Feature

**Location:** `src/features/ai/`

### Purpose
AI-powered chat interface with streaming responses.

### Files

#### `lib/ai-config.ts` — Configuration

```tsx
export const DEFAULT_MODEL = openai("gpt-4-turbo");

export const AI_CONFIG = {
  systemPrompt: "You are a helpful AI assistant...",
  maxTokens: 2000,
  temperature: 0.7,
};
```

**How to modify:**
- Change model: `openai("gpt-3.5-turbo")` or `anthropic("claude-3-5-sonnet-20241022")`
- Adjust creativity: Lower temperature (0.3) = more focused, higher (1.0) = more creative
- Increase output: Raise `maxTokens` (max 4096 for GPT-4)

#### `lib/actions.ts` — AI Streaming

**`generateChatStream(messages: ModelMessage[])`**

**Purpose:** Server-side function that calls AI SDK

```tsx
export async function generateChatStream(messages: ModelMessage[]) {
  const result = streamText({
    model: DEFAULT_MODEL,
    system: AI_CONFIG.systemPrompt,
    messages,
    maxOutputTokens: AI_CONFIG.maxTokens,
    temperature: AI_CONFIG.temperature,
  });
  
  return result;
}
```

**Not used directly** — called by API route

#### `components/chat-interface.tsx` — Chat UI

**Purpose:** Client-side chat interface with streaming

**Key features:**
- Auto-scroll to latest message
- Loading indicators
- Error handling
- Message history

**How it works:**
```tsx
const { messages, sendMessage, status } = useChat({
  api: "/api/chat", // API route
});

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  await sendMessage({ text: input });
  setInput("");
};
```

**Customization:**
- Add message persistence: Store in database, load on mount
- Add file uploads: Use `useChat` with `body` parameter
- Add tool calling: Configure in API route with `tools` parameter

### API Route

**Location:** `src/app/api/chat/route.ts`

**Purpose:** Endpoint that streams AI responses

```tsx
export async function POST(req: Request) {
  // 1. Check auth
  const user = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  
  // 2. Parse messages
  const { messages } = await req.json();
  
  // 3. Generate stream
  const result = await generateChatStream(messages);
  
  // 4. Return stream
  return createUIMessageStreamResponse({ status: 200, stream: result.fullStream });
}
```

**Customization:**
- Add rate limiting: Check usage count before generating
- Add context injection: Prepend system message with user data
- Add tool calling: Add `tools` parameter to `streamText`

### Common Modifications

**Add conversation history:**

1. Create messages table:
```tsx
const messages = pgTable("messages", {
  id: uuid("id").primaryKey(),
  conversationId: uuid("conversation_id"),
  role: text("role"),
  content: text("content"),
  createdAt: timestamp("created_at"),
});
```

2. Save messages in API route:
```tsx
await db.insert(messages).values({
  conversationId,
  role: "user",
  content: userMessage,
});
```

3. Load on mount:
```tsx
const { messages, setMessages } = useChat();

useEffect(() => {
  const loadHistory = async () => {
    const history = await fetch("/api/conversations/123");
    setMessages(history);
  };
  loadHistory();
}, []);
```

**Add tool calling (function calling):**

```tsx
const result = streamText({
  model: DEFAULT_MODEL,
  messages,
  tools: {
    getWeather: {
      description: "Get weather for a location",
      parameters: z.object({
        location: z.string(),
      }),
      execute: async ({ location }) => {
        const weather = await fetchWeather(location);
        return weather;
      },
    },
  },
});
```

---

## Admin Feature

**Location:** `src/features/admin/`

### Purpose
Admin panel for managing users, organizations, and license keys.

### Access Control

**Environment variable:** `ADMIN_EMAILS=admin@example.com,support@example.com`

**Layout check:**
```tsx
// app/(dashboard)/admin/layout.tsx
const ADMIN_EMAILS = process.env.ADMIN_EMAILS.split(",");

if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
  redirect("/dashboard");
}
```

**Server Action check:**
```tsx
// features/admin/lib/actions.ts
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!ADMIN_EMAILS.includes(user.email)) {
    throw new Error("Unauthorized");
  }
  return user;
}
```

### Files

#### `lib/queries.ts` — Admin Queries

**`getAdminMetrics()`**
- Returns: Total users, orgs, licenses, active subscriptions
- Used in: Admin overview page

**`getAdminUsers(page, pageSize)`**
- Returns: Paginated user list
- Used in: Users table

**`getAdminOrganizations(page, pageSize)`**
- Returns: Paginated org list with member counts
- Used in: Organizations table

**`getAdminLicenseKeys(page, pageSize)`**
- Returns: Paginated license keys
- Used in: Licenses table

#### `lib/actions.ts` — Admin Actions

**`createLicenseKey(input)`**
- Generates key in format: `305-XXXXX-XXXXX-XXXXX-XXXXX`
- Stores in database
- Returns: Created license

**`revokeLicenseKey(licenseId)`**
- Sets `isActive: false`
- Prevents further activations

**`deleteUser(userId)`**
- Deletes user profile
- **Warning:** Cascading deletes may fail if user has orgs

**`deleteOrganization(orgId)`**
- Deletes organization
- **Warning:** Also deletes all memberships

#### `components/admin-shell.tsx` — Admin Layout

**Purpose:** Navigation tabs for admin pages

**Tabs:**
- Overview (metrics)
- Users
- Organizations
- Licenses

#### `components/metric-card.tsx` — Metric Display

**Purpose:** Reusable card for displaying numbers

**Props:**
```tsx
interface MetricCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
}
```

#### `components/users-table.tsx` — User Management

**Features:**
- Display all users with email, name, Stripe status
- Delete button with confirmation
- Loading states

**Customization:**
- Add search: Filter users by email
- Add bulk actions: Select multiple, delete all
- Add user details modal: Click row to see full profile

#### `components/organizations-table.tsx` — Org Management

**Features:**
- Display orgs with member count, subscription status
- Delete button with confirmation
- Badge colors based on subscription status

#### `components/licenses-table.tsx` — License Management

**Features:**
- Display license keys with activation counts
- Revoke button
- Status badges (Active, Expired, Revoked)

#### `components/create-license-form.tsx` — License Generation

**Features:**
- Email input
- Plan dropdown (Starter/Pro/Enterprise)
- Max activations input
- Generate button

**How it works:**
```tsx
const handleSubmit = async (e) => {
  e.preventDefault();
  const result = await createLicenseKey({
    email,
    plan,
    maxActivations: parseInt(maxActivations),
  });
  
  if (result.success) {
    setMessage(`License created: ${result.data.key}`);
  }
};
```

### Common Modifications

**Add user impersonation:**

1. Add action:
```tsx
export async function impersonateUser(userId: string) {
  await requireAdmin();
  const token = generateImpersonationToken(userId);
  return { token };
}
```

2. Add button to users table:
```tsx
<button onClick={() => impersonate(user.id)}>
  Impersonate
</button>
```

**Add export to CSV:**

```tsx
export async function exportUsers() {
  await requireAdmin();
  const users = await db.select().from(profiles);
  const csv = convertToCSV(users);
  return new Response(csv, {
    headers: { "Content-Type": "text/csv" },
  });
}
```

---

## Email Feature

**Location:** `src/features/email/`

### Purpose
Transactional email templates and sending logic.

### Files

#### `templates/welcome.tsx` — Welcome Email

**Sent when:** User signs up

**Contains:**
- Greeting with user name
- Quick start steps
- Link to dashboard

**Customization:**
- Add company logo: Use `<Img src="https://..." />`
- Add social links: Use `<Link>` components
- Change colors: Modify inline styles

#### `templates/password-reset.tsx` — Password Reset

**Sent when:** User requests password reset

**Contains:**
- Reset link with token
- Expiration notice (1 hour)
- Security note

#### `templates/invite-member.tsx` — Team Invitation

**Sent when:** User invites someone to org

**Contains:**
- Inviter name
- Organization name
- Role badge
- Accept invitation link

#### `lib/send-emails.ts` — Send Helpers

**`sendWelcomeEmail(to, userName)`**
```tsx
export async function sendWelcomeEmail(to: string, userName: string) {
  return sendEmail({
    to,
    subject: "Welcome to 305 Starter Kit",
    react: WelcomeEmail({ userName, appUrl: APP_URL }),
  });
}
```

**When to call:**
- After successful signup
- In signup form or Supabase webhook

**`sendPasswordResetEmail(to, userName, resetToken)`**
- Call when user clicks "Forgot password"
- Generate token with Supabase: `supabase.auth.resetPasswordForEmail()`

**`sendInviteMemberEmail(to, inviterName, orgName, role, inviteToken)`**
- Call when owner invites new member
- Generate invite token, store in database

### Common Modifications

**Add new email template:**

1. Create template:
```tsx
// templates/subscription-canceled.tsx
export function SubscriptionCanceledEmail({ userName, planName }) {
  return (
    <Html>
      <Body>
        <Heading>Subscription Canceled</Heading>
        <Text>Hi {userName}, your {planName} subscription has been canceled.</Text>
      </Body>
    </Html>
  );
}
```

2. Add send helper:
```tsx
export async function sendSubscriptionCanceledEmail(to, userName, planName) {
  return sendEmail({
    to,
    subject: "Subscription Canceled",
    react: SubscriptionCanceledEmail({ userName, planName }),
  });
}
```

3. Call in webhook:
```tsx
case "customer.subscription.deleted":
  await sendSubscriptionCanceledEmail(user.email, user.name, plan.name);
  break;
```

**Preview emails in development:**

```bash
npx react-email dev
# Opens http://localhost:3000 with all templates
```

---

## Dashboard Feature

**Location:** `src/features/dashboard/`

### Purpose
Main dashboard layout with sidebar navigation.

### Files

#### `components/dashboard-shell.tsx` — Layout

**Purpose:** Sidebar + main content area

**Features:**
- Navigation items with active state
- User avatar and email
- Sign out button
- Responsive (collapses on mobile)

**Navigation items:**
```tsx
const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Brain, label: "AI Chat", href: "/dashboard/ai" },
  { icon: Shield, label: "Organization", href: "/dashboard/org" },
  { icon: CreditCard, label: "Billing", href: "/dashboard/billing" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  { icon: BookOpen, label: "Docs", href: "/dashboard/docs" },
  { icon: Shield, label: "Admin", href: "/admin" },
];
```

**How to add nav item:**
1. Import icon from `lucide-react`
2. Add to `navItems` array
3. Create page at corresponding route

**Customization:**
- Add org switcher: Fetch user's orgs, show dropdown
- Add notifications: Add bell icon with badge
- Add search: Add search input in sidebar

---

## Licensing Feature

**Location:** `src/features/licensing/`

### Purpose
License key validation for commercial distribution.

### Files

#### `lib/validate.ts` — Validation Logic

**`validateLicenseKey(key: string)`**

**Checks:**
1. Key exists in database
2. Key is active (not revoked)
3. Key hasn't expired
4. Activations under limit

**Returns:**
```tsx
{
  valid: boolean;
  plan?: string;
  message: string;
}
```

**`activateLicenseKey(key: string)`**

**Flow:**
1. Validate key
2. Increment `currentActivations`
3. Return success

**Usage:** Call when buyer activates your boilerplate

### API Endpoints

**`POST /api/license/validate`**
```bash
curl -X POST https://yourapp.com/api/license/validate \
  -H "Content-Type: application/json" \
  -d '{"key": "305-XXXXX-XXXXX-XXXXX-XXXXX"}'
```

**Response:**
```json
{
  "valid": true,
  "plan": "pro",
  "message": "License key is valid"
}
```

**`POST /api/license/activate`**
- Same as validate but increments activation count

### Integration in Buyer's App

**Buyer adds to their app:**

```tsx
// Check license on app start
const response = await fetch("https://305starterkit.com/api/license/validate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ key: process.env.LICENSE_KEY }),
});

const { valid } = await response.json();
if (!valid) {
  throw new Error("Invalid license key");
}
```

---

## Shared UI Components

**Location:** `src/components/ui/`

### Button

**Variants:**
- `default` — Gold with glow
- `destructive` — Red
- `outline` — Border only
- `secondary` — Turquoise with glow
- `ghost` — Transparent
- `link` — Underlined text

**Sizes:**
- `default` — h-10 px-4
- `sm` — h-9 px-3
- `lg` — h-11 px-8
- `icon` — h-10 w-10

**Usage:**
```tsx
<Button variant="default" size="lg">
  Subscribe Now
</Button>
```

### Card

**Components:**
- `Card` — Container
- `CardHeader` — Top section
- `CardTitle` — Heading
- `CardDescription` — Subtext
- `CardContent` — Main content
- `CardFooter` — Bottom section

**Usage:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Content</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Input

**Usage:**
```tsx
<Input
  type="email"
  placeholder="you@example.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

### Label

**Usage:**
```tsx
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />
```

### Badge

**Variants:**
- `default` — Gold
- `secondary` — Turquoise
- `destructive` — Red
- `success` — Emerald
- `outline` — Border only

**Usage:**
```tsx
<Badge variant="success">Active</Badge>
```

### Dialog

**Usage:**
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    <p>Content</p>
    <DialogFooter>
      <Button onClick={() => setIsOpen(false)}>Close</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Tabs

**Usage:**
```tsx
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">
    <p>Tab 1 content</p>
  </TabsContent>
  <TabsContent value="tab2">
    <p>Tab 2 content</p>
  </TabsContent>
</Tabs>
```

---

## Quick Reference

### When to Use What

| Need | Use |
|------|-----|
| Fetch data in page | Server Component with direct DB query |
| Mutate data from form | Server Action |
| Interactive UI | Client Component with `"use client"` |
| Protect route | Layout with auth check |
| Public API | API route in `app/api/` |
| Send email | Call `sendEmail()` from Server Action |
| Check subscription | `checkSubscription()` in page |
| Admin-only page | Check `ADMIN_EMAILS` in layout |

### Import Paths

```tsx
// Features
import { getCurrentUser } from "@/features/auth";
import { createCheckoutSession } from "@/features/billing";
import { sendWelcomeEmail } from "@/features/email";

// UI Components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Database
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

// Supabase
import { createClient } from "@/lib/supabase/server"; // Server
import { createClient } from "@/lib/supabase/client"; // Client

// Utilities
import { cn } from "@/lib/utils";
```
