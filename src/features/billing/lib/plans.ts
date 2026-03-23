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
    name: "Explorer",
    description: "Try IdeaLab free — validate up to 3 ideas per month.",
    price: 0,
    interval: "month",
    stripePriceId:
      process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER ?? "price_starter",
    features: [
      { text: "3 idea validations per month", included: true },
      { text: "Market fit analysis", included: true },
      { text: "Competition mapping", included: true },
      { text: "Email support", included: true },
      { text: "Monetization strategies", included: false },
      { text: "MVP roadmap generation", included: false },
    ],
  },
  {
    id: "pro",
    name: "Founder",
    description: "Unlimited validations for serious founders.",
    price: 29,
    interval: "month",
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ?? "price_pro",
    popular: true,
    features: [
      { text: "Unlimited idea validations", included: true },
      { text: "Full market fit analysis", included: true },
      { text: "Competition mapping", included: true },
      { text: "Monetization strategies", included: true },
      { text: "MVP roadmap generation", included: true },
      { text: "Priority support", included: false },
    ],
  },
  {
    id: "enterprise",
    name: "Accelerator",
    description: "For teams and accelerators validating multiple ideas.",
    price: 99,
    interval: "month",
    stripePriceId:
      process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE ?? "price_enterprise",
    features: [
      { text: "Unlimited idea validations", included: true },
      { text: "Full market fit analysis", included: true },
      { text: "Competition mapping", included: true },
      { text: "Monetization strategies", included: true },
      { text: "MVP roadmap generation", included: true },
      { text: "Priority support + team access", included: true },
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
