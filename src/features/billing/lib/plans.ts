export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: "month" | "year";
  stripePriceId: string;
  features: PlanFeature[];
  popular?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for small projects and solo founders.",
    price: 29,
    interval: "month",
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER ?? "price_starter",
    features: [
      { text: "Up to 3 team members", included: true },
      { text: "5 GB storage", included: true },
      { text: "Basic AI features", included: true },
      { text: "Email support", included: true },
      { text: "Advanced analytics", included: false },
      { text: "Custom integrations", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For growing teams that need more power.",
    price: 79,
    interval: "month",
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ?? "price_pro",
    popular: true,
    features: [
      { text: "Up to 20 team members", included: true },
      { text: "50 GB storage", included: true },
      { text: "Advanced AI features", included: true },
      { text: "Priority support", included: true },
      { text: "Advanced analytics", included: true },
      { text: "Custom integrations", included: false },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For organizations that need full control.",
    price: 199,
    interval: "month",
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE ?? "price_enterprise",
    features: [
      { text: "Unlimited team members", included: true },
      { text: "Unlimited storage", included: true },
      { text: "Full AI suite", included: true },
      { text: "Dedicated support", included: true },
      { text: "Advanced analytics", included: true },
      { text: "Custom integrations", included: true },
    ],
  },
];

export function getPlanByPriceId(priceId: string): Plan | undefined {
  return PLANS.find((plan) => plan.stripePriceId === priceId);
}

export function getPlanById(planId: string): Plan | undefined {
  return PLANS.find((plan) => plan.id === planId);
}

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired"
  | "paused";

export function isActiveSubscription(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing";
}
