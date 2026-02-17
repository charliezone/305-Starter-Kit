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

### 1. Clone & Install

```bash
git clone <repo-url> && cd 305-starter-kit
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Fill in all credentials (see Environment Variables section below).

### 3. Push Database Schema

```bash
npm run db:push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key |
| `OPENAI_API_KEY` | Yes | OpenAI API key (for AI features) |
| `RESEND_API_KEY` | For email | Resend API key |
| `EMAIL_FROM` | For email | Sender address |
| `ADMIN_EMAILS` | For admin | Comma-separated admin emails |
| `NEXT_PUBLIC_STRIPE_PRICE_*` | For billing | Stripe Price IDs per plan |
| `NEXT_PUBLIC_APP_URL` | Yes | App URL (e.g., `http://localhost:3000`) |

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