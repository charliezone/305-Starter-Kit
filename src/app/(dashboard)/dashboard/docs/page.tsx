import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Documentation — 305 Starter Kit",
};

export default function DocsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
        <p className="mt-2 text-muted-foreground">
          Everything you need to build, customize, and deploy your SaaS.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DocSection
          title="1. Getting Started"
          badge="Setup"
          content={[
            "Clone the repository and run `npm install`.",
            "Copy `.env.example` to `.env` and fill in your credentials.",
            "Run `npm run db:push` to push the database schema to Supabase.",
            "Run `npm run dev` to start the development server.",
            "Visit http://localhost:3000 to see the app.",
          ]}
        />

        <DocSection
          title="2. Authentication"
          badge="Supabase Auth"
          content={[
            "Auth is handled by Supabase via `@supabase/ssr`.",
            "Server client: `src/lib/supabase/server.ts` — for Server Components and Actions.",
            "Client: `src/lib/supabase/client.ts` — for client-side components.",
            "Middleware at `src/middleware.ts` refreshes sessions and protects routes.",
            "OAuth callback handled at `/auth/callback`.",
            "Login and signup forms are in `features/auth/components/`.",
          ]}
        />

        <DocSection
          title="3. Database & Schema"
          badge="Drizzle ORM"
          content={[
            "Schema files live in `src/lib/db/schema/`.",
            "Tables: `profiles`, `organizations`, `memberships`, `license_keys`.",
            "Multi-tenancy: 1 user → many orgs via memberships with roles.",
            "Run `npm run db:generate` to create migration files.",
            "Run `npm run db:push` for quick schema sync in development.",
            "Run `npm run db:studio` for a visual database browser.",
          ]}
        />

        <DocSection
          title="4. Stripe Billing"
          badge="Payments"
          content={[
            "Stripe client initialized lazily in `src/lib/stripe/`.",
            "Billing actions: `features/billing/lib/actions.ts`.",
            "Webhook handler: `app/api/webhooks/stripe/route.ts`.",
            "Events handled: checkout.completed, subscription.updated, subscription.deleted, invoice.payment_failed.",
            "Plans defined in `features/billing/lib/plans.ts` — edit prices there.",
            "Subscription gating: `features/billing/lib/subscription-guard.ts`.",
            "Billing page with pricing cards at `/dashboard/billing`.",
          ]}
        />

        <DocSection
          title="5. AI Integration"
          badge="Vercel AI SDK"
          content={[
            "Uses AI SDK v6 with `useChat` hook from `@ai-sdk/react`.",
            "Chat API route at `app/api/chat/route.ts` — streams responses.",
            "Config in `features/ai/lib/ai-config.ts` — model, system prompt, tokens.",
            "Swap models by changing the provider in `ai-config.ts` (OpenAI, Anthropic, etc.).",
            "Chat UI at `/dashboard/ai` — fully functional streaming interface.",
          ]}
        />

        <DocSection
          title="6. Email System"
          badge="Resend"
          content={[
            "Email client in `src/lib/email/index.ts` using Resend.",
            "Templates built with React Email in `features/email/templates/`.",
            "3 templates included: Welcome, Password Reset, Invite Member.",
            "Send functions in `features/email/lib/send-emails.ts`.",
            "All templates use the Miami Premium dark theme.",
            "Set RESEND_API_KEY in your `.env` to enable.",
          ]}
        />

        <DocSection
          title="7. Admin Dashboard"
          badge="Admin"
          content={[
            "Access controlled via ADMIN_EMAILS env var (comma-separated).",
            "Routes under `/admin` — protected by admin layout check.",
            "Overview with metrics: users, orgs, subscriptions, licenses.",
            "User management: view, delete users.",
            "Org management: view members, subscription status, delete.",
            "License key management: create, view, revoke keys.",
          ]}
        />

        <DocSection
          title="8. License Key System"
          badge="Distribution"
          content={[
            "For selling the boilerplate to other developers.",
            "Schema: `license_keys` table with key, plan, activations, expiry.",
            "API endpoints: POST `/api/license/validate` and `/api/license/activate`.",
            "Admin can generate keys from `/admin/licenses`.",
            "Keys follow format: `305-XXXXX-XXXXX-XXXXX-XXXXX`.",
            "Supports max activations and expiration dates.",
          ]}
        />
      </div>

      <Separator />

      <div>
        <h2 className="mb-4 text-xl font-semibold">Project Structure</h2>
        <Card>
          <CardContent className="p-6">
            <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-muted-foreground">
{`src/
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
├── features/                     # Feature-based modules
│   ├── admin/                    # Admin queries, actions, components
│   ├── ai/                       # AI chat config + components
│   ├── auth/                     # Auth actions, queries, forms
│   ├── billing/                  # Stripe checkout, plans, gating
│   ├── dashboard/                # Dashboard shell + layout
│   ├── email/                    # React Email templates + send functions
│   └── licensing/                # License key validation + activation
└── lib/                          # Shared utilities
    ├── db/schema/                # Drizzle ORM schemas
    ├── email/                    # Resend client
    ├── stripe/                   # Stripe client
    ├── supabase/                 # Supabase server/client/middleware
    └── types/                    # Shared Zod schemas + TS types`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DocSection({
  title,
  badge,
  content,
}: {
  title: string;
  badge: string;
  content: string[];
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <Badge variant="secondary">{badge}</Badge>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {content.map((item, i) => (
            <li key={i} className="text-sm text-muted-foreground leading-relaxed">
              <span className="text-foreground/70 mr-2">•</span>
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
