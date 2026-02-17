import { getAdminMetrics } from "@/features/admin";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { MetricCard } from "@/features/admin/components/metric-card";
import { Users, Building2, KeyRound, CreditCard } from "lucide-react";

export const metadata = {
  title: "Admin — 305 Starter Kit",
};

export default async function AdminPage() {
  const metrics = await getAdminMetrics();

  return (
    <AdminShell>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Users"
          value={metrics.totalUsers}
          icon={Users}
          description="Registered accounts"
        />
        <MetricCard
          title="Organizations"
          value={metrics.totalOrganizations}
          icon={Building2}
          description="Active workspaces"
        />
        <MetricCard
          title="Active Subscriptions"
          value={metrics.activeSubscriptions}
          icon={CreditCard}
          description="Paying organizations"
        />
        <MetricCard
          title="License Keys"
          value={metrics.totalLicenses}
          icon={KeyRound}
          description="Issued licenses"
        />
      </div>
    </AdminShell>
  );
}
