# 305 Starter Kit — Project Rules

## Core Technology Stack (exact versions matter)
- **Framework**: Next.js 16.x (App Router, React 19) — NOT Pages Router.
- **Database**: Drizzle ORM 0.45+ with PostgreSQL via Supabase. Connection is lazy-initialized via Proxy in `src/lib/db/index.ts`.
- **Authentication**: Supabase Auth via `@supabase/ssr` 0.8. Two clients: server (`lib/supabase/server.ts`, async) and browser (`lib/supabase/client.ts`, sync).
- **Styling**: Tailwind CSS v4 with manually-built Shadcn/UI components. Theme defined in `src/app/globals.css` using `@theme inline` syntax.
- **AI**: Vercel AI SDK v6 (`ai` 6.x, `@ai-sdk/openai` 3.x, `@ai-sdk/react` 3.x). Uses `useChat` from `ai/react` with `sendMessage` — NOT `handleSubmit`/`input`.
- **Payments**: Stripe 20.x (API version 2026-01-28.clover). Client is lazy-initialized via Proxy in `src/lib/stripe/index.ts`.
- **Email**: React Email + Resend. Client in `src/lib/email/index.ts`.
- **Validation**: Zod v4 for all Server Action inputs and API request bodies.
- **TypeScript**: Strict mode. Zero `any` types allowed.

## Architecture Rules

### Feature-Based Folder Structure
All domain logic goes in `src/features/<feature>/`:
```
features/<feature>/
├── components/      # React components (client or server)
├── lib/
│   ├── actions.ts   # "use server" — mutations with Zod validation
│   ├── queries.ts   # Database reads (no "use server" needed if only called from server)
│   └── *.ts         # Feature-specific utils (plans.ts, validate.ts, etc.)
└── index.ts         # Barrel exports — this is the public API
```
Current features: `auth`, `billing`, `ai`, `admin`, `email`, `licensing`, `dashboard`.

**Import rule**: Always import from the barrel `@/features/<feature>`, never from internal files directly.

### Server-First Approach
- Default to React Server Components. Add `"use client"` ONLY when the component needs: `useState`, `useEffect`, `useRouter`, event handlers, or browser APIs.
- Server Components can `await` directly (DB queries, auth checks). Client Components cannot.
- Layouts (`layout.tsx`) should handle auth checks and data fetching. Pages render the UI.

### Server Actions Pattern
- Every action file starts with `"use server"`.
- Validate all inputs with Zod `safeParse` before any DB operation.
- Return `ActionResponse` type: `{ success: boolean; data?: T; error?: string }`.
- Call `revalidatePath()` after mutations to clear Next.js cache.
- No custom API routes unless needed for: webhooks (`/api/webhooks/stripe`), public APIs (`/api/license/*`), or streaming (`/api/chat`).

### Database Patterns
- Schema-first: Define tables in `src/lib/db/schema/<table>.ts`, export from `schema/index.ts`.
- Use Drizzle's type inference: `typeof table.$inferSelect` for reads, `$inferInsert` for writes.
- Always destructure single results: `const [row] = await db.select()...` — never treat arrays as objects.
- Use `eq`, `and`, `or` from `drizzle-orm` for where clauses.
- Current tables: `profiles`, `organizations`, `memberships`, `licenseKeys`.

### Multi-Tenancy Model
- Users → Profiles (1:1 via `userId`)
- Users → Organizations (many-to-many via `memberships` join table)
- Each membership has a role: `owner`, `admin`, `member`
- Stripe billing is per Organization (not per user)
- For 1:1 use cases: auto-create org on signup, user is always `owner`

### Supabase Auth Rules
- Server-side: `const supabase = await createClient()` (async, reads cookies)
- Client-side: `const supabase = createClient()` (sync, no await)
- Always use `supabase.auth.getUser()` not `getSession()` for security
- Middleware at `src/middleware.ts` refreshes sessions and protects routes
- OAuth callback handled at `/auth/callback/route.ts`

### Stripe Integration Rules
- Checkout sessions MUST include `metadata: { org_id }` — webhook handler depends on it
- Webhook handler at `/api/webhooks/stripe/route.ts` uses `req.text()` NOT `req.json()`
- Plans defined in `features/billing/lib/plans.ts` — single source of truth for pricing
- Subscription gating via `checkSubscription()` from `features/billing`
- Price IDs come from env vars: `NEXT_PUBLIC_STRIPE_PRICE_STARTER`, `_PRO`, `_ENTERPRISE`

### AI SDK v6 Rules
- API route returns `result.toDataStreamResponse()` for streaming — never `NextResponse.json()`
- Client uses `useChat` from `ai/react` — NOT from `ai`
- Config centralized in `features/ai/lib/ai-config.ts`
- Model swappable: `openai()`, `anthropic()`, `google()` — just change the import

### Admin Access
- Protected by `ADMIN_EMAILS` env var (comma-separated emails)
- Layout check in `app/(dashboard)/admin/layout.tsx`
- Server-side check via `requireAdmin()` in every admin action

## UI/UX Standards (Miami Premium Style)

### Theme
- Dark-first, professional, high-end aesthetic.
- Backgrounds: Slate-950 (`oklch(0.10 0.01 264)`)
- Primary: Gold (`oklch(0.80 0.15 85)`)
- Secondary: Turquoise (`oklch(0.70 0.14 195)`)
- Success: Emerald (`oklch(0.70 0.17 155)`)
- Destructive: Red (`oklch(0.55 0.20 25)`)

### Components
- Use existing Shadcn/UI components from `src/components/ui/` for all interactive elements.
- Available: Button, Card, Input, Label, Badge, Separator, Avatar, Dialog, Tabs.
- All components use `class-variance-authority` for variants and `cn()` from `@/lib/utils` for class merging.
- Custom CSS utilities available: `.text-gradient-miami`, `.glass-panel`, `.glow-gold`, `.glow-turquoise`.

### Icons
- Use `lucide-react` for all icons. Import individual icons, never the whole library.

## Code Style
- Imports at the top of every file. Never import mid-file.
- Use absolute imports with `@/` prefix (maps to `src/`).
- Prefer named exports over default exports (except pages/layouts which must be default).
- Use `interface` for component props, `type` for unions/intersections.
- No console.log in production code — use it only for debugging, then remove.
- Error boundaries: wrap risky operations in try/catch, return ActionResponse with error message.

## Environment Variables
- All env vars documented in `.env.example`.
- `NEXT_PUBLIC_*` vars are exposed to the browser — never put secrets there.
- Lazy-initialized clients (DB, Stripe, Resend) allow builds without env vars set.
- Required: `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `OPENAI_API_KEY`, `NEXT_PUBLIC_APP_URL`.
- Optional: `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAILS`, `NEXT_PUBLIC_STRIPE_PRICE_STARTER`, `NEXT_PUBLIC_STRIPE_PRICE_PRO`, `NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE`.

## File Naming Conventions
- Components: `kebab-case.tsx` (e.g., `pricing-cards.tsx`, `login-form.tsx`)
- Schema files: `kebab-case.ts` (e.g., `license-keys.ts`)
- Actions/queries: `actions.ts`, `queries.ts` (standard names per feature)
- Pages: `page.tsx` (Next.js convention)
- Layouts: `layout.tsx` (Next.js convention)
- API routes: `route.ts` (Next.js convention)

## Route Map (19 routes)

### Public
- `/` — Landing page (static)
- `/login` — Login form (static)
- `/signup` — Signup form (static)
- `/auth/callback` — Supabase OAuth callback (API route)

### Protected (require auth via middleware)
- `/dashboard` — Overview
- `/dashboard/ai` — AI streaming chat
- `/dashboard/billing` — Stripe pricing + subscription status
- `/dashboard/docs` — In-app documentation

### Admin (require ADMIN_EMAILS match)
- `/admin` — Metrics overview
- `/admin/users` — User management table
- `/admin/organizations` — Org management table
- `/admin/licenses` — License key management + creation

### API
- `POST /api/chat` — AI streaming endpoint (auth required)
- `POST /api/webhooks/stripe` — Stripe webhook (no auth, signature verified)
- `POST /api/license/validate` — Public license validation
- `POST /api/license/activate` — Public license activation

## Common Pitfalls to Avoid
- Do NOT use `getSession()` — always `getUser()` for Supabase auth checks.
- Do NOT use `req.json()` in the Stripe webhook — use `req.text()` or signature verification breaks.
- Do NOT import from internal feature paths — always use barrel `@/features/<feature>`.
- Do NOT pass server functions as props to client components — import and call directly.
- Do NOT forget `revalidatePath()` after mutations — pages will show stale data.
- Do NOT use `NextResponse.json()` for AI streaming — use `toDataStreamResponse()`.
- Do NOT hardcode Stripe Price IDs — they come from env vars and differ between test/live.
- Do NOT create API routes for simple mutations — use Server Actions instead.
