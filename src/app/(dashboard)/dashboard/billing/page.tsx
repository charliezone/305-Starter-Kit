import { getSubscriptionStatus } from "@/features/billing";
import { PricingCards } from "@/features/billing/components/pricing-cards";
import { BillingStatus } from "@/features/billing/components/billing-status";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Billing — 305 Starter Kit",
};

export default async function BillingPage() {
  const subscription = await getSubscriptionStatus();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your subscription and billing details.
        </p>
      </div>

      {subscription?.stripeSubscriptionId && (
        <>
          <BillingStatus
            status={{
              organizationName: subscription.organizationName,
              stripeSubscriptionId: subscription.stripeSubscriptionId,
              stripePriceId: subscription.stripePriceId,
              stripeSubscriptionStatus: subscription.stripeSubscriptionStatus,
            }}
          />
          <Separator />
        </>
      )}

      <div>
        <h2 className="mb-6 text-xl font-semibold">
          {subscription?.stripeSubscriptionId ? "Change Plan" : "Choose a Plan"}
        </h2>
        <PricingCards currentPriceId={subscription?.stripePriceId} />
      </div>
    </div>
  );
}
