import Link from "next/link";
import { Zap, Shield, Brain, Layers } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Auth & Multi-Tenancy",
    description:
      "Supabase Auth with organizations, roles, and row-level security out of the box.",
  },
  {
    icon: Brain,
    title: "AI-Ready",
    description:
      "Vercel AI SDK with streaming responses, tool calling, and modular agent architecture.",
  },
  {
    icon: Layers,
    title: "Stripe Billing",
    description:
      "Subscription management, webhooks, and customer portal pre-wired and ready to go.",
  },
  {
    icon: Zap,
    title: "Ship Fast",
    description:
      "Next.js 15, Drizzle ORM, Tailwind CSS, and Shadcn/UI — production-grade from day one.",
  },
] as const;

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="text-lg font-bold tracking-tight text-gradient-miami">
            305 Starter Kit
          </span>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 glow-gold"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Build Your SaaS
            <span className="block text-gradient-miami">In Record Time</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            The production-ready starter kit with authentication, multi-tenancy,
            AI integration, and Stripe billing — so you can focus on what makes
            your product unique.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 glow-gold"
            >
              Start Building
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center rounded-xl border border-border px-8 text-base font-semibold text-foreground transition-colors hover:bg-muted"
            >
              View on GitHub
            </a>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mx-auto mt-24 grid max-w-5xl gap-6 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="glass-panel p-6 transition-all hover:border-primary/30 hover:glow-gold"
            >
              <feature.icon className="h-8 w-8 text-secondary" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 text-center text-sm text-muted-foreground">
        <p>
          Built with{" "}
          <span className="text-gradient-miami font-medium">
            305 Starter Kit
          </span>
        </p>
      </footer>
    </div>
  );
}
