import { createClient } from "@/lib/supabase/server";
import { Zap, Brain, Shield, CreditCard } from "lucide-react";

export const metadata = {
  title: "Dashboard — 305 Starter Kit",
};

const quickLinks = [
  {
    icon: Brain,
    title: "AI Chat",
    description: "Test the AI streaming integration",
    href: "/dashboard/ai",
  },
  {
    icon: Shield,
    title: "Organization",
    description: "Manage your team and roles",
    href: "/dashboard/org",
  },
  {
    icon: CreditCard,
    title: "Billing",
    description: "Manage your subscription",
    href: "/dashboard/billing",
  },
  {
    icon: Zap,
    title: "Settings",
    description: "Configure your account",
    href: "/dashboard/settings",
  },
] as const;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back
          {user?.email ? `, ${user.email.split("@")[0]}` : ""}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Here&apos;s an overview of your workspace.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((link) => (
          <a
            key={link.title}
            href={link.href}
            className="glass-panel p-5 transition-all hover:border-primary/30 hover:glow-gold group"
          >
            <link.icon className="h-6 w-6 text-secondary transition-colors group-hover:text-primary" />
            <h3 className="mt-3 font-semibold text-foreground">
              {link.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {link.description}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
