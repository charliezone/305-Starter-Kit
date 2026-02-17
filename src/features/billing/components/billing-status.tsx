"use client";

import { useTransition } from "react";
import { createPortalSession } from "../lib/actions";
import { getPlanByPriceId, isActiveSubscription } from "../lib/plans";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink } from "lucide-react";

interface BillingStatusProps {
  status: {
    organizationName: string;
    stripeSubscriptionId: string | null;
    stripePriceId: string | null;
    stripeSubscriptionStatus: string | null;
  };
}

export function BillingStatus({ status }: BillingStatusProps) {
  const [isPending, startTransition] = useTransition();
  const plan = status.stripePriceId ? getPlanByPriceId(status.stripePriceId) : null;
  const isActive = isActiveSubscription(status.stripeSubscriptionStatus);

  const handleManageBilling = () => {
    startTransition(async () => {
      await createPortalSession();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Subscription</CardTitle>
        <CardDescription>
          Billing for {status.organizationName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">
              {plan?.name ?? "Free"}
            </p>
            {plan && (
              <p className="text-sm text-muted-foreground">
                ${plan.price}/{plan.interval}
              </p>
            )}
          </div>
          <Badge variant={isActive ? "success" : "destructive"}>
            {status.stripeSubscriptionStatus ?? "No subscription"}
          </Badge>
        </div>

        {status.stripeSubscriptionId && (
          <Button
            variant="outline"
            onClick={handleManageBilling}
            disabled={isPending}
            className="w-full"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Manage Billing
                <ExternalLink className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
