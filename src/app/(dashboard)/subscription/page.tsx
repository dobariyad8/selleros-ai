"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Check,
  CircleCheckBig,
  CreditCard,
  LoaderCircle,
  LockKeyhole,
  Settings,
  Sparkles,
  Store,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

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

type SubscriptionDetails = {
  planKey: string;
  status: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  cancelAt: string | null;
  canceledAt: string | null;
  canStartCheckout: boolean;
  canManageBilling: boolean;
};

type SubscriptionResponse = {
  success: boolean;
  subscription?: SubscriptionDetails;
  error?: string;
};

type CheckoutResponse = {
  success: boolean;
  url?: string;
  error?: string;
};

type PortalResponse = {
  success: boolean;
  url?: string;
  error?: string;
};

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

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function formatDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getStatusBadgeVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  if (
    status === "active" ||
    status === "trialing"
  ) {
    return "default";
  }

  if (
    status === "past_due" ||
    status === "unpaid"
  ) {
    return "destructive";
  }

  if (status === "early_access") {
    return "secondary";
  }

  return "outline";
}

export default function SubscriptionPage() {
  const searchParams = useSearchParams();

  const {
    shop,
    analyzedListings,
    totalAvailable,
    isLoading: areListingsLoading,
  } = useListings();

  const [
    subscription,
    setSubscription,
  ] = useState<SubscriptionDetails | null>(
    null,
  );

  const [
    isSubscriptionLoading,
    setIsSubscriptionLoading,
  ] = useState(true);

  const [
    isStartingCheckout,
    setIsStartingCheckout,
  ] = useState(false);

  const [
    isOpeningPortal,
    setIsOpeningPortal,
  ] = useState(false);

  const [
    subscriptionError,
    setSubscriptionError,
  ] = useState("");

  const loadSubscription =
    useCallback(async () => {
      setIsSubscriptionLoading(true);
      setSubscriptionError("");

      try {
        const response = await fetch(
          "/api/stripe/subscription",
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const data =
          (await response.json()) as SubscriptionResponse;

        if (
          !response.ok ||
          !data.success ||
          !data.subscription
        ) {
          throw new Error(
            data.error ??
              "Could not load your subscription.",
          );
        }

        setSubscription(data.subscription);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Could not load your subscription.";

        setSubscriptionError(message);
      } finally {
        setIsSubscriptionLoading(false);
      }
    }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSubscription();
  }, [loadSubscription]);

  useEffect(() => {
    const checkoutResult =
      searchParams.get("checkout");

    if (checkoutResult === "success") {
      toast.success(
        "Payment completed. Your subscription is being activated.",
      );

      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadSubscription();
    }

    if (checkoutResult === "cancelled") {
      toast.info(
        "Checkout was cancelled. No payment was made.",
      );
    }
  }, [loadSubscription, searchParams]);

  async function startCheckout() {
    if (isStartingCheckout) {
      return;
    }

    setIsStartingCheckout(true);

    try {
      const response = await fetch(
        "/api/stripe/checkout",
        {
          method: "POST",
        },
      );

      const data =
        (await response.json()) as CheckoutResponse;

      if (
        !response.ok ||
        !data.success ||
        !data.url
      ) {
        throw new Error(
          data.error ??
            "Could not start Stripe Checkout.",
        );
      }

      window.location.assign(data.url);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not start Stripe Checkout.",
      );

      setIsStartingCheckout(false);
    }
  }

  async function openBillingPortal() {
    if (isOpeningPortal) {
      return;
    }

    setIsOpeningPortal(true);

    try {
      const response = await fetch(
        "/api/stripe/portal",
        {
          method: "POST",
        },
      );

      const data =
        (await response.json()) as PortalResponse;

      if (
        !response.ok ||
        !data.success ||
        !data.url
      ) {
        throw new Error(
          data.error ??
            "Could not open the billing portal.",
        );
      }

      window.location.assign(data.url);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not open the billing portal.",
      );

      setIsOpeningPortal(false);
    }
  }

  const analyzedCount =
    analyzedListings.length;

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

  const urgentListings =
    analyzedListings.filter(
      ({ analysis }) =>
        analysis.scores.overall < 70,
    ).length;

  const isPaidPlan =
    subscription?.planKey === "pro" &&
    ["active", "trialing"].includes(
      subscription.status,
    );

  const planName = isPaidPlan
    ? "SellerOS Pro"
    : "SellerOS Early Access";

  const planPrice = isPaidPlan
    ? "$19.99"
    : "Free";

  const planPriceSuffix = isPaidPlan
    ? "per month"
    : "during early access";

  const planDescription = isPaidPlan
    ? "Your paid SellerOS Pro subscription is active."
    : "Full access to the current SellerOS development version.";

  const scheduledCancellationDate =
    formatDate(
      subscription?.cancelAt ??
        (subscription?.cancelAtPeriodEnd
          ? subscription.currentPeriodEnd
          : null),
    );

  const renewalDate = formatDate(
    subscription?.currentPeriodEnd ?? null,
  );

  const hasScheduledCancellation =
    Boolean(subscription?.cancelAt) ||
    Boolean(
      subscription?.cancelAtPeriodEnd,
    );

  const isLoading =
    areListingsLoading ||
    isSubscriptionLoading;

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
          Review your current plan, billing status,
          connected-shop usage, and SellerOS features.
        </p>
      </div>

      {subscriptionError && (
        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="font-medium text-destructive">
            Subscription unavailable
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            {subscriptionError}
          </p>

          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={() => {
              void loadSubscription();
            }}
          >
            Try again
          </Button>
        </div>
      )}

      <Card className="mt-6 min-w-0 border-primary/30 bg-primary/3">
        <CardContent className="p-4 sm:p-6">
          <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Sparkles className="size-5" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="wrap-break-words text-xl font-bold">
                    {planName}
                  </h2>

                  <Badge className="w-fit">
                    Current plan
                  </Badge>

                  {subscription && (
                    <Badge
                      variant={getStatusBadgeVariant(
                        subscription.status,
                      )}
                      className="w-fit"
                    >
                      {formatStatus(
                        subscription.status,
                      )}
                    </Badge>
                  )}
                </div>

                <p className="mt-1 wrap-break-words text-sm text-muted-foreground">
                  {planDescription}
                </p>

                {hasScheduledCancellation &&
                  scheduledCancellationDate && (
                    <p className="mt-2 text-sm font-medium text-amber-700">
                      Your subscription will end on{" "}
                      {scheduledCancellationDate}.
                    </p>
                  )}
                
                {isPaidPlan &&
                  !hasScheduledCancellation &&
                  renewalDate && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Next billing date:{" "}
                      {renewalDate}
                    </p>
                  )}
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-3 lg:items-end">
              <div className="flex flex-wrap items-end gap-2">
                <p className="text-3xl font-bold">
                  {planPrice}
                </p>

                <p className="pb-1 text-sm text-muted-foreground">
                  {planPriceSuffix}
                </p>
              </div>

              {subscription?.canStartCheckout ? (
                <Button
                  type="button"
                  disabled={isStartingCheckout}
                  onClick={() => {
                    void startCheckout();
                  }}
                >
                  {isStartingCheckout ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      Opening Checkout…
                    </>
                  ) : (
                    <>
                      <CreditCard className="size-4" />
                      Upgrade to Pro
                    </>
                  )}
                </Button>
              ) : subscription?.canManageBilling ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isOpeningPortal}
                  onClick={() => {
                    void openBillingPortal();
                  }}
                >
                  {isOpeningPortal ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      Opening Billing…
                    </>
                  ) : (
                    <>
                      <Settings className="size-4" />
                      Manage Billing
                    </>
                  )}
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Subscription billing is active
                </p>
              )}
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
                    Included with {planName}
                  </span>
                </CardTitle>

                <CardDescription className="mt-2 wrap-break-words">
                  Features currently available in your
                  SellerOS account.
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
              Current connected-listing and audit usage.
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
                {listingUsage}% of the current reference
                limit
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
                    Secure Stripe billing
                  </p>

                  <p className="mt-1 wrap-break-words text-sm leading-6 text-muted-foreground">
                    Subscription payments are completed
                    through Stripe Checkout. SellerOS does
                    not directly store card details.
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
            expanded SellerOS plans.
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
            Additional plans, usage limits, and features
            may change before the public SellerOS launch.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}