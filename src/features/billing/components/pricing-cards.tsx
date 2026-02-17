"use client";

import { useTransition } from "react";
import { PLANS, type Plan } from "../lib/plans";
import { createCheckoutSession } from "../lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, X, Loader2 } from "lucide-react";

interface PricingCardsProps {
  currentPriceId?: string | null;
}

export function PricingCards({ currentPriceId }: PricingCardsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {PLANS.map((plan) => (
        <PricingCard
          key={plan.id}
          plan={plan}
          isCurrent={currentPriceId === plan.stripePriceId}
        />
      ))}
    </div>
  );
}

function PricingCard({ plan, isCurrent }: { plan: Plan; isCurrent: boolean }) {
  const [isPending, startTransition] = useTransition();

  const handleSubscribe = () => {
    startTransition(async () => {
      await createCheckoutSession(plan.stripePriceId);
    });
  };

  return (
    <Card
      className={cn(
        "relative flex flex-col",
        plan.popular && "border-primary glow-gold"
      )}
    >
      {plan.popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
          Most Popular
        </Badge>
      )}
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="mb-6">
          <span className="text-4xl font-bold">${plan.price}</span>
          <span className="text-muted-foreground">/{plan.interval}</span>
        </div>
        <ul className="space-y-3">
          {plan.features.map((feature) => (
            <li key={feature.text} className="flex items-center gap-2 text-sm">
              {feature.included ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground/50" />
              )}
              <span
                className={cn(
                  feature.included ? "text-foreground" : "text-muted-foreground/50"
                )}
              >
                {feature.text}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        {isCurrent ? (
          <Button variant="outline" className="w-full" disabled>
            Current Plan
          </Button>
        ) : (
          <Button
            className="w-full"
            variant={plan.popular ? "default" : "outline"}
            onClick={handleSubscribe}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              `Subscribe to ${plan.name}`
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
