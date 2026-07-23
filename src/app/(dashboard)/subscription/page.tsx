"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  CreditCard,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const includedFeatures = [
  "Connected Etsy listing analysis",
  "AI listing auditor",
  "SEO recommendations",
  "Keyword insights",
  "Image coverage insights",
  "Listing analytics",
  "Top-performer rankings",
];

const futureFeatures = [
  "Advanced sales analytics",
  "Automated listing updates",
  "Competitor keyword research",
  "Scheduled optimization reports",
];

export default function SubscriptionPage() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl px-3 sm:px-4 lg:px-0">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">
          SellerOS Account
        </p>

        <h1 className="mt-2 flex min-w-0 items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
          <CreditCard className="size-7 shrink-0" />

          <span className="min-w-0 wrap-break-words">
            Subscription
          </span>
        </h1>

        <p className="mt-2 max-w-2xl wrap-break-words text-sm leading-6 text-muted-foreground sm:text-base">
          Review your current SellerOS plan and the
          features available in this version.
        </p>
      </div>

      <div className="mt-6 grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]">
        <Card className="min-w-0 border-primary/30">
          <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <Sparkles className="size-5 shrink-0 text-primary" />

                  <CardTitle className="wrap-break-words">
                    SellerOS Early Access
                  </CardTitle>
                </div>

                <CardDescription className="mt-2 wrap-break-words">
                  Your current development and testing
                  plan.
                </CardDescription>
              </div>

              <Badge className="w-fit shrink-0">
                Current plan
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                Current price
              </p>

              <div className="mt-2 flex flex-wrap items-end gap-2">
                <p className="text-3xl font-bold">
                  Free
                </p>

                <p className="pb-1 text-sm text-muted-foreground">
                  during early access
                </p>
              </div>
            </div>

            <div className="mt-5">
              <p className="font-semibold">
                Included features
              </p>

              <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2">
                {includedFeatures.map((feature) => (
                  <div
                    key={feature}
                    className="flex min-w-0 items-start gap-2"
                  >
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <Check className="size-3.5" />
                    </span>

                    <span className="min-w-0 wrap-break-words text-sm">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                nativeButton={false}
                className="w-full sm:w-auto"
                render={<Link href="/dashboard" />}
              >
                Open Dashboard
                <ArrowRight className="size-4" />
              </Button>

              <Button
                variant="outline"
                nativeButton={false}
                className="w-full sm:w-auto"
                render={<Link href="/settings" />}
              >
                Manage Etsy Connection
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
            <CardTitle className="wrap-break-words">
              Coming Later
            </CardTitle>

            <CardDescription className="wrap-break-words">
              Planned capabilities for future paid
              plans.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="space-y-3">
              {futureFeatures.map((feature) => (
                <div
                  key={feature}
                  className="flex min-w-0 items-start gap-2 rounded-lg border bg-muted/20 p-3"
                >
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                  <p className="min-w-0 wrap-break-words text-sm">
                    {feature}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-4 wrap-break-words text-xs leading-5 text-muted-foreground">
              Billing is not enabled yet. No payment
              information is being collected by
              SellerOS.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}