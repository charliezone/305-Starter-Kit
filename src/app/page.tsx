import Link from "next/link";
import { Lightbulb, TrendingUp, Target, Rocket } from "lucide-react";

const features = [
  {
    icon: Lightbulb,
    title: "Instant AI Analysis",
    description:
      "Describe your idea and get real-time market fit analysis, competitive landscape, and viability score.",
  },
  {
    icon: TrendingUp,
    title: "Monetization Strategies",
    description:
      "AI-generated revenue models, pricing recommendations, and go-to-market strategies tailored to your idea.",
  },
  {
    icon: Target,
    title: "Competition Mapping",
    description:
      "Identify key competitors, market gaps, and your unique positioning — all in seconds.",
  },
  {
    icon: Rocket,
    title: "From Idea to MVP",
    description:
      "Get a prioritized feature list, tech stack recommendations, and a launch timeline for your startup.",
  },
] as const;

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="text-lg font-bold tracking-tight text-gradient-miami">
            IdeaLab
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
            Validate Your Startup Idea
            <span className="block text-gradient-miami">
              With AI in Seconds
            </span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Stop guessing. Describe your startup idea and get instant AI-powered
            analysis — market fit, competition, monetization, and a roadmap to
            your MVP.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 glow-gold"
            >
              Try It Free
            </Link>
            <a
              href="https://github.com/charliezone/305-Starter-Kit"
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
          <span className="text-gradient-miami font-medium">IdeaLab</span> |
          Powered by{" "}
          <a
            href="https://github.com/charliezone/305-Starter-Kit"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gradient-miami font-medium hover:underline"
          >
            305 Starter Kit
          </a>
        </p>
      </footer>
    </div>
  );
}
