"use client";

import { useTransition } from "react";
import { revokeLicenseKey } from "../lib/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Ban } from "lucide-react";
import type { LicenseKey } from "@/lib/db/schema";

interface LicensesTableProps {
  licenses: LicenseKey[];
  total: number;
}

export function LicensesTable({ licenses, total }: LicensesTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{total} total license keys</p>
      </div>
      <div className="rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Key</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plan</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Activations</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Expires</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {licenses.map((license) => (
              <LicenseRow key={license.id} license={license} />
            ))}
            {licenses.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No license keys found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LicenseRow({ license }: { license: LicenseKey }) {
  const [isPending, startTransition] = useTransition();

  const handleRevoke = () => {
    if (!confirm(`Revoke license key ${license.key}?`)) return;
    startTransition(async () => {
      await revokeLicenseKey(license.id);
    });
  };

  const isExpired = license.expiresAt && new Date(license.expiresAt) < new Date();

  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3 font-mono text-xs">{license.key}</td>
      <td className="px-4 py-3 text-muted-foreground">{license.email}</td>
      <td className="px-4 py-3">
        <Badge variant="secondary">{license.plan}</Badge>
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {license.currentActivations}/{license.maxActivations}
      </td>
      <td className="px-4 py-3">
        {!license.isActive ? (
          <Badge variant="destructive">Revoked</Badge>
        ) : isExpired ? (
          <Badge variant="destructive">Expired</Badge>
        ) : (
          <Badge variant="success">Active</Badge>
        )}
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {license.expiresAt
          ? new Date(license.expiresAt).toLocaleDateString()
          : "Never"}
      </td>
      <td className="px-4 py-3 text-right">
        {license.isActive && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRevoke}
            disabled={isPending}
            className="text-destructive hover:text-destructive"
            title="Revoke license"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Ban className="h-4 w-4" />
            )}
          </Button>
        )}
      </td>
    </tr>
  );
}
