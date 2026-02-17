"use client";

import { useState, useTransition } from "react";
import { createLicenseKey } from "../lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";

export function CreateLicenseForm() {
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("starter");
  const [maxActivations, setMaxActivations] = useState("1");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await createLicenseKey({
        email,
        plan,
        maxActivations: parseInt(maxActivations, 10),
      });

      if (result.success) {
        setMessage({ type: "success", text: `License created: ${(result.data as { key: string }).key}` });
        setEmail("");
        setPlan("starter");
        setMaxActivations("1");
      } else {
        setMessage({ type: "error", text: result.error ?? "Failed to create license" });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Create License Key</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="license-email">Customer Email</Label>
              <Input
                id="license-email"
                type="email"
                placeholder="customer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license-plan">Plan</Label>
              <select
                id="license-plan"
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="license-activations">Max Activations</Label>
              <Input
                id="license-activations"
                type="number"
                min="1"
                max="100"
                value={maxActivations}
                onChange={(e) => setMaxActivations(e.target.value)}
              />
            </div>
          </div>

          {message && (
            <p
              className={
                message.type === "success"
                  ? "text-sm font-mono text-success"
                  : "text-sm text-destructive"
              }
            >
              {message.text}
            </p>
          )}

          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Generate License Key
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
