"use client";

import { useTransition } from "react";
import { deleteOrganization } from "../lib/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";

interface OrgRow {
  id: string;
  name: string;
  slug: string;
  stripeSubscriptionStatus: string | null;
  stripePriceId: string | null;
  createdAt: Date;
  memberCount: number;
}

interface OrganizationsTableProps {
  organizations: OrgRow[];
  total: number;
}

export function OrganizationsTable({ organizations, total }: OrganizationsTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{total} total organizations</p>
      </div>
      <div className="rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Slug</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Members</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Subscription</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {organizations.map((org) => (
              <OrgRowItem key={org.id} org={org} />
            ))}
            {organizations.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No organizations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrgRowItem({ org }: { org: OrgRow }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm(`Delete organization "${org.name}"? This will remove all memberships.`)) return;
    startTransition(async () => {
      await deleteOrganization(org.id);
    });
  };

  const statusVariant =
    org.stripeSubscriptionStatus === "active"
      ? "success"
      : org.stripeSubscriptionStatus === "past_due"
        ? "destructive"
        : "outline";

  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3 font-medium">{org.name}</td>
      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{org.slug}</td>
      <td className="px-4 py-3 text-muted-foreground">{org.memberCount}</td>
      <td className="px-4 py-3">
        <Badge variant={statusVariant}>
          {org.stripeSubscriptionStatus ?? "Free"}
        </Badge>
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {new Date(org.createdAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3 text-right">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={isPending}
          className="text-destructive hover:text-destructive"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </td>
    </tr>
  );
}
