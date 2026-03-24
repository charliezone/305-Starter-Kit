# 305 Starter Kit

A high-performance, commercial-grade SaaS boilerplate designed for rapid MVP deployment. Ships with authentication, multi-tenancy, Stripe billing, AI integration, email system, admin dashboard, and license key distribution — all wired together and ready to customize.

## Tech Stack

| Layer          | Technology                              |
| -------------- | --------------------------------------- |
| Framework      | Next.js 15 (App Router, React 19)      |
| Database       | Drizzle ORM + PostgreSQL (Supabase)     |
| Auth           | Supabase Auth (SSR via `@supabase/ssr`) |
| Styling        | Tailwind CSS v4 + Shadcn/UI            |
| AI             | Vercel AI SDK v6 (`ai`, `@ai-sdk/*`)   |
| Payments       | Stripe (subscriptions + portal)         |
| Email          | React Email + Resend                    |
| Language       | TypeScript (strict mode, no `any`)      |

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Login, Signup pages
│   ├── (dashboard)/              # Protected dashboard + admin
│   │   ├── admin/                # Admin panel (metrics, users, orgs, licenses)
│   │   └── dashboard/            # User dashboard (overview, AI, billing, docs)
│   ├── api/
│   │   ├── chat/                 # AI streaming endpoint
│   │   ├── license/              # License validate + activate endpoints
│   │   └── webhooks/stripe/      # Stripe webhook handler
│   └── auth/callback/            # Supabase OAuth callback
├── components/ui/                # Shadcn/UI components
│   ├── button.tsx, card.tsx      # Core UI primitives
│   ├── dialog.tsx, tabs.tsx      # Interactive components
│   └── input.tsx, label.tsx      # Form components
├── features/                     # Feature-based modules
│   ├── admin/                    # Admin queries, actions, components
│   ├── ai/                       # AI chat config + streaming components
│   ├── auth/                     # Auth actions, queries, forms
│   ├── billing/                  # Stripe checkout, plans, subscription gating
│   ├── dashboard/                # Dashboard shell + sidebar layout
│   ├── email/                    # React Email templates + send functions
│   └── licensing/                # License key validation + activation
└── lib/                          # Shared utilities
    ├── db/schema/                # Drizzle ORM schemas (4 tables)
    ├── email/                    # Resend client
    ├── stripe/                   # Stripe client (lazy-init)
    ├── supabase/                 # Server/client/middleware helpers
    ├── types/                    # Shared Zod schemas + TypeScript types
    └── utils.ts                  # cn() helper
```

## Getting Started

```bash
git clone https://github.com/charliezone/305-Starter-Kit.git && cd 305-Starter-Kit
npm install
cp .env.example .env
```

Then follow the setup guides below to fill in your `.env` file.

---

## Setup Guide

### 1. Supabase (Auth + Database)

Supabase provides both **authentication** and the **PostgreSQL database**.

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Choose a name, password, and region → **Create Project**
3. Wait for the project to finish provisioning (~2 minutes)
4. Go to **Settings → API** and copy:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

5. Go to **Settings → Database → Connection string → Direct** and copy:

```bash
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
```

> **Tip:** Replace `[YOUR-PASSWORD]` with the password you set when creating the project.

6. Push the database schema:

```bash
npm run db:push
```

This creates all 4 tables: `profiles`, `organizations`, `memberships`, `license_keys`.

7. **(Optional) Enable OAuth providers:**
   - Go to **Authentication → Providers**
   - Enable Google, GitHub, etc.
   - Add redirect URL: `http://localhost:3000/auth/callback`

---

### 2. Stripe (Payments + Subscriptions)

Stripe handles **checkout, subscriptions, and the customer billing portal**.

1. Go to [stripe.com](https://stripe.com) → **Create account** (or log in)
2. Make sure you're in **Test mode** (toggle in top-right)
3. Go to **Developers → API keys** and copy:

```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

4. **Create 3 products with prices:**
   - Go to **Product catalog → Add product**
   - Create 3 products (e.g., Explorer, Founder, Accelerator)
   - For each, add a **recurring price** (monthly)
   - Copy each Price ID (`price_...`) into:

```bash
NEXT_PUBLIC_STRIPE_PRICE_STARTER=price_...
NEXT_PUBLIC_STRIPE_PRICE_PRO=price_...
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE=price_...
```

5. **Set up webhook (local development):**

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
brew install stripe/stripe-cli/stripe

# Login and forward events
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

The CLI will print a webhook signing secret — copy it:

```bash
STRIPE_WEBHOOK_SECRET=whsec_e20ec391937df77037ca7387bc979db3ba62cb1fdae5add5dec586c2eeebec0d
```

6. **Set up webhook (production):**
   - Go to **Developers → Webhooks → Add endpoint**
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events to subscribe:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
   - Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

7. **Test card number:** `4242 4242 4242 4242` (any future date, any CVC)

---

### 3. OpenAI (AI Features)

Powers the **AI streaming chat** on `/dashboard/ai`.

1. Go to [platform.openai.com](https://platform.openai.com) → **Sign up / Log in**
2. Go to **API keys → Create new secret key**
3. Copy the key:

```bash
OPENAI_API_KEY=sk-proj-...
```

> **Note:** You need credits on your OpenAI account. New accounts get $5 free. After that, add a payment method at [platform.openai.com/settings/organization/billing](https://platform.openai.com/settings/organization/billing).

The default model is `gpt-4o-mini` (fast and cheap). To change it, edit `src/features/ai/lib/ai-config.ts`.

---

### 4. Resend (Transactional Email) — Optional

Powers **welcome emails, password resets, and team invites**. Skip this if you don't need email yet.

1. Go to [resend.com](https://resend.com) → **Sign up**
2. Go to **API Keys → Create API Key**
3. Copy:

```bash
RESEND_API_KEY=re_...
EMAIL_FROM=YourApp <onboarding@resend.dev>
```

> **For production:** You must verify your own domain at **Domains → Add domain** and add the DNS records (SPF + DKIM). Then update `EMAIL_FROM` to use your domain.

---

### 5. Admin Access — Optional

The admin panel at `/admin` is protected by email whitelist.

```bash
ADMIN_EMAILS=you@example.com,cofounder@example.com
```

Comma-separated list. Only users whose Supabase auth email matches will see the admin panel.

---

### 6. App URL

```bash
# Development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Production (update when you deploy)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

### 7. Run It

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see the landing page.

**Quick test flow:**
1. Click **Sign Up** → create an account
2. Go to **Dashboard** → you're authenticated
3. Go to **AI Chat** (or Validate Idea) → test streaming AI
4. Go to **Billing** → see pricing tiers (use test card `4242 4242 4242 4242`)
5. Go to **Admin** → if your email is in `ADMIN_EMAILS`, you'll see the admin panel

---

## Environment Variables Reference

| Variable | Required | Where to get it |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase → Settings → API |
| `DATABASE_URL` | Yes | Supabase → Settings → Database → Connection string |
| `STRIPE_SECRET_KEY` | Yes | Stripe → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe CLI or Stripe → Developers → Webhooks |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe → Developers → API keys |
| `OPENAI_API_KEY` | Yes | OpenAI → API keys |
| `RESEND_API_KEY` | Optional | Resend → API Keys |
| `EMAIL_FROM` | Optional | Your verified sender address |
| `ADMIN_EMAILS` | Optional | Comma-separated admin emails |
| `NEXT_PUBLIC_STRIPE_PRICE_STARTER` | For billing | Stripe → Product catalog → Price ID |
| `NEXT_PUBLIC_STRIPE_PRICE_PRO` | For billing | Stripe → Product catalog → Price ID |
| `NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE` | For billing | Stripe → Product catalog → Price ID |
| `NEXT_PUBLIC_APP_URL` | Yes | Your deployment URL |

## Database Commands

| Command | Description |
| --- | --- |
| `npm run db:generate` | Generate migration files from schema |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:push` | Push schema directly (dev) |
| `npm run db:studio` | Open Drizzle Studio GUI |

## Features Guide

### Authentication (Supabase)

- Email/password login and signup with forms in `features/auth/components/`
- Server-side session management via `@supabase/ssr`
- Middleware protects all `/dashboard` and `/admin` routes
- OAuth callback at `/auth/callback` — ready for Google, GitHub, etc.

### Multi-Tenancy Database

- **`profiles`** — user-specific data linked to Supabase Auth
- **`organizations`** — tenant containers with Stripe billing fields
- **`memberships`** — composite PK join table with roles: `owner`, `admin`, `member`
- **`license_keys`** — for commercial distribution (activations, expiry, revoke)

### Stripe Billing

- **Pricing page** at `/dashboard/billing` with 3-tier plan cards
- **Checkout** — creates Stripe Customer on first subscribe, redirects to Checkout
- **Customer Portal** — manage subscription, update payment method
- **Webhook handler** at `/api/webhooks/stripe` handles:
  - `checkout.session.completed` → activate subscription
  - `customer.subscription.updated` → sync plan changes
  - `customer.subscription.deleted` → mark canceled
  - `invoice.payment_failed` → mark past_due
- **Subscription gating** via `checkSubscription()` — use in layouts or middleware
- Plans defined in `features/billing/lib/plans.ts` — edit prices and features there

### AI Integration (Vercel AI SDK v6)

- Streaming chat API at `/api/chat` using `streamText` + `createUIMessageStreamResponse`
- Client component uses `useChat` hook from `@ai-sdk/react`
- Config centralized in `features/ai/lib/ai-config.ts`
- Swap any model (OpenAI, Anthropic, Google) by changing the provider

### Email System (React Email + Resend)

- 3 dark-themed templates: Welcome, Password Reset, Invite Member
- Templates in `features/email/templates/` — built with `@react-email/components`
- Send helpers in `features/email/lib/send-emails.ts`
- Resend client in `lib/email/index.ts`

### Admin Dashboard

- Access controlled by `ADMIN_EMAILS` environment variable
- Routes under `/admin` — metrics overview, user management, org management
- License key management — create, view, and revoke keys
- All admin actions use server-side authorization checks

### License Key System (Distribution)

- For selling the boilerplate to other developers
- Generate keys from admin panel: `305-XXXXX-XXXXX-XXXXX-XXXXX`
- API endpoints for external validation:
  - `POST /api/license/validate` — check if key is valid
  - `POST /api/license/activate` — activate a key (increments counter)
- Supports max activations, expiration dates, and revocation

### UI Components (Shadcn/UI)

Included components: `Button`, `Card`, `Input`, `Label`, `Badge`, `Separator`, `Avatar`, `Dialog`, `Tabs`

All styled with the Miami Premium theme — gold primary, turquoise accents.

## Theme

Dark-first "Miami Premium" palette:

- **Background**: Slate-950
- **Primary**: Gold (oklch 0.80 0.15 85)
- **Secondary**: Turquoise (oklch 0.70 0.14 195)
- **Success**: Emerald (oklch 0.70 0.17 155)

Custom utilities: `.text-gradient-miami`, `.glass-panel`, `.glow-gold`, `.glow-turquoise`

## Stripe Setup Guide

1. Create products and prices in [Stripe Dashboard](https://dashboard.stripe.com/products)
2. Copy the Price IDs into your `.env` as `NEXT_PUBLIC_STRIPE_PRICE_*`
3. Set up a webhook endpoint pointing to `https://yourdomain.com/api/webhooks/stripe`
4. Subscribe to events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
5. Copy the webhook signing secret into `.env` as `STRIPE_WEBHOOK_SECRET`
6. For local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

## Adding New Features

Follow the feature-based architecture:

```bash
src/features/your-feature/
├── components/     # React components (client or server)
├── lib/
│   ├── actions.ts  # Server Actions with Zod validation
│   └── queries.ts  # Database queries
└── index.ts        # Barrel exports
```

## License

Private — commercial use.