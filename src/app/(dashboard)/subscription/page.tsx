"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  CircleCheckBig,
  CreditCard,
  LockKeyhole,
  Sparkles,
  Store,
  Zap,
} from "lucide-react";

import { useListings } from "@/hooks/useListings";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

const includedFeatures = [
  "Connected Etsy listing analysis",
  "AI listing auditor",
  "SEO recommendations",
  "Keyword insights",
  "Image coverage insights",
  "Listing analytics",
  "Top-performer rankings",
  "Mobile dashboard access",
];

const futureFeatures = [
  {
    name: "Advanced sales analytics",
    description:
      "Revenue, conversion, and sales trend reporting.",
  },
  {
    name: "Automated listing updates",
    description:
      "Apply approved optimizations directly to Etsy.",
  },
  {
    name: "Competitor keyword research",
    description:
      "Compare keywords and positioning across similar listings.",
  },
  {
    name: "Scheduled reports",
    description:
      "Receive recurring shop-health and opportunity reports.",
  },
];

function getUsagePercentage(
  current: number,
  limit: number,
) {
  if (limit <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.round((current / limit) * 100),
  );
}

export default function SubscriptionPage() {
  const {
    shop,
    analyzedListings,
    totalAvailable,
    isLoading,
  } = useListings();

  const analyzedCount = analyzedListings.length;

  const auditLimit = 100;
  const listingLimit = 100;

  const listingUsage = getUsagePercentage(
    totalAvailable,
    listingLimit,
  );

  const auditUsage = getUsagePercentage(
    analyzedCount,
    auditLimit,
  );

  const urgentListings = analyzedListings.filter(
    ({ analysis }) =>
      analysis.scores.overall < 70,
  ).length;

  if (isLoading) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-6xl px-3 sm:px-4 lg:px-0">
        <div className="space-y-3">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-10 w-64 max-w-full" />
          <Skeleton className="h-5 w-full max-w-2xl" />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map(
            (_, index) => (
              <Skeleton
                key={index}
                className="h-28 rounded-xl"
              />
            ),
          )}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl px-3 sm:px-4 lg:px-0">
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
          Review your current plan, connected-shop usage,
          and features planned for future SellerOS plans.
        </p>
      </div>

      <Card className="mt-6 min-w-0 border-primary/30 bg-primary/3">
        <CardContent className="p-4 sm:p-6">
          <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Sparkles className="size-5" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="wrap-break-words text-xl font-bold">
                    SellerOS Early Access
                  </h2>

                  <Badge className="w-fit">
                    Current plan
                  </Badge>
                </div>

                <p className="mt-1 wrap-break-words text-sm text-muted-foreground">
                  Full access to the current SellerOS
                  development version.
                </p>
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-1 lg:items-end">
              <div className="flex flex-wrap items-end gap-2">
                <p className="text-3xl font-bold">
                  Free
                </p>

                <p className="pb-1 text-sm text-muted-foreground">
                  during early access
                </p>
              </div>

              <p className="text-xs text-muted-foreground">
                No payment method required
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="min-w-0">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Store className="size-4 text-muted-foreground" />

              <p className="text-sm text-muted-foreground">
                Connected shop
              </p>
            </div>

            <p className="mt-2 wrap-break-words text-xl font-bold">
              {shop?.shopName ?? "Not connected"}
            </p>

            <p className="mt-2 text-xs text-muted-foreground">
              {shop
                ? "Etsy connection is active"
                : "Connect Etsy from Settings"}
            </p>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="size-4 text-muted-foreground" />

              <p className="text-sm text-muted-foreground">
                Listings analyzed
              </p>
            </div>

            <p className="mt-2 text-2xl font-bold">
              {analyzedCount}
            </p>

            <p className="mt-2 text-xs text-muted-foreground">
              {totalAvailable} listings available
            </p>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-muted-foreground" />

              <p className="text-sm text-muted-foreground">
                Priority opportunities
              </p>
            </div>

            <p className="mt-2 text-2xl font-bold">
              {urgentListings}
            </p>

            <p className="mt-2 text-xs text-muted-foreground">
              Listings currently scoring below 70
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <Card className="min-w-0 border-primary/30">
          <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2">
                  <CircleCheckBig className="size-5 shrink-0 text-emerald-600" />

                  <span className="wrap-break-words">
                    Included with Early Access
                  </span>
                </CardTitle>

                <CardDescription className="mt-2 wrap-break-words">
                  Features available in your current
                  SellerOS plan.
                </CardDescription>
              </div>

              <Badge
                variant="outline"
                className="w-fit shrink-0"
              >
                Active
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              {includedFeatures.map((feature) => (
                <div
                  key={feature}
                  className="flex min-w-0 items-start gap-2 rounded-lg border bg-muted/20 p-3"
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
              Current Usage
            </CardTitle>

            <CardDescription className="wrap-break-words">
              Informational early-access usage limits.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="min-w-0">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-medium">
                  Connected listings
                </p>

                <p className="shrink-0 text-sm font-semibold">
                  {totalAvailable}/{listingLimit}
                </p>
              </div>

              <Progress value={listingUsage} />

              <p className="mt-2 text-xs text-muted-foreground">
                {listingUsage}% of the early-access
                reference limit
              </p>
            </div>

            <div className="min-w-0">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-medium">
                  Listing audits
                </p>

                <p className="shrink-0 text-sm font-semibold">
                  {analyzedCount}/{auditLimit}
                </p>
              </div>

              <Progress value={auditUsage} />

              <p className="mt-2 text-xs text-muted-foreground">
                Audits are generated from connected
                listings
              </p>
            </div>

            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-0.5 size-5 shrink-0 text-muted-foreground" />

                <div className="min-w-0">
                  <p className="font-medium">
                    Billing is not enabled
                  </p>

                  <p className="mt-1 wrap-break-words text-sm leading-6 text-muted-foreground">
                    SellerOS does not currently collect
                    payment details or charge subscription
                    fees.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 min-w-0">
        <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
          <CardTitle className="wrap-break-words">
            Future Plan Features
          </CardTitle>

          <CardDescription className="wrap-break-words">
            Planned capabilities that may become part of
            future paid plans.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            {futureFeatures.map((feature) => (
              <div
                key={feature.name}
                className="flex min-w-0 items-start gap-3 rounded-xl border p-4"
              >
                <Sparkles className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                <div className="min-w-0">
                  <p className="wrap-break-words font-medium">
                    {feature.name}
                  </p>

                  <p className="mt-1 wrap-break-words text-sm leading-6 text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 wrap-break-words text-xs leading-5 text-muted-foreground">
            Plan names, prices, limits, and future
            features are not finalized and may change
            before billing is introduced.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}