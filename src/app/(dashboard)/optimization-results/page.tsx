"use client";

import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Camera,
  CheckCircle2,
  CircleMinus,
  Clock3,
  ExternalLink,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type OptimizationOutcome =
  | "pending"
  | "improved"
  | "declined"
  | "mixed"
  | "flat";

type SnapshotStage =
  | "baseline"
  | "day_7"
  | "day_14"
  | "day_30"
  | "manual";

type PerformanceSnapshot = {
  stage: SnapshotStage;
  listingState: string | null;
  favoriteCount: number;
  transactionCount: number;
  unitsSold: number;
  revenueAmount: number;
  revenueCurrency: string | null;
  capturedAt: string;
};

type OptimizationResult = {
  updateHistoryId: string;

  shopId: number;
  shopName: string | null;

  listingId: number;
  listingTitle: string | null;

  updatedFields: {
    title: boolean;
    description: boolean;
    tags: boolean;
  };

  updatedAt: string;

  baseline: PerformanceSnapshot | null;

  latestSnapshot: PerformanceSnapshot | null;

  changes: {
    favorites: number | null;
    transactions: number | null;
    unitsSold: number | null;
    revenue: number | null;
  };

  outcome: OptimizationOutcome;

  availableStages: SnapshotStage[];
};

type OptimizationSummary = {
  totalOptimizations: number;
  pending: number;
  improved: number;
  declined: number;
  mixed: number;
  flat: number;
  totalFavoriteChange: number;
  totalTransactionChange: number;
  totalUnitsSoldChange: number;
  totalRevenueChange: number;
};

type OptimizationResultsResponse = {
  success: boolean;
  summary?: OptimizationSummary;
  results?: OptimizationResult[];
  error?: string;
};

type CaptureManualSnapshotResponse = {
  success: boolean;
  updateHistoryId?: string;
  listingId?: number;
  snapshot?: PerformanceSnapshot;
  error?: string;
};

function formatDate(
  value: string,
) {
  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function formatStage(
  stage: SnapshotStage,
) {
  switch (stage) {
    case "baseline":
      return "Baseline";

    case "day_7":
      return "Day 7";

    case "day_14":
      return "Day 14";

    case "day_30":
      return "Day 30";

    case "manual":
      return "Manual preview";
  }
}

function getUpdatedFieldNames(
  result: OptimizationResult,
) {
  const fields: string[] = [];

  if (
    result.updatedFields.title
  ) {
    fields.push("Title");
  }

  if (
    result.updatedFields.description
  ) {
    fields.push("Description");
  }

  if (
    result.updatedFields.tags
  ) {
    fields.push("Tags");
  }

  return fields;
}

function getOutcomeDetails(
  outcome: OptimizationOutcome,
) {
  switch (outcome) {
    case "improved":
      return {
        label: "Improved",
        classes:
          "bg-emerald-100 text-emerald-700",
        icon: ArrowUpRight,
      };

    case "declined":
      return {
        label: "Declined",
        classes:
          "bg-destructive/10 text-destructive",
        icon: ArrowDownRight,
      };

    case "mixed":
      return {
        label: "Mixed",
        classes:
          "bg-amber-100 text-amber-700",
        icon: Activity,
      };

    case "flat":
      return {
        label: "No change",
        classes:
          "bg-muted text-muted-foreground",
        icon: CircleMinus,
      };

    case "pending":
      return {
        label: "Pending",
        classes:
          "bg-blue-100 text-blue-700",
        icon: Clock3,
      };
  }
}

function formatChange(
  value: number | null,
) {
  if (value === null) {
    return "Pending";
  }

  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}

function formatMoney(
  value: number | null,
  currency: string | null,
) {
  if (value === null) {
    return "Pending";
  }

  if (!currency) {
    return formatChange(value);
  }

  try {
    return new Intl.NumberFormat(
      undefined,
      {
        style: "currency",
        currency,
      },
    ).format(value);
  } catch {
    return `${formatChange(
      value,
    )} ${currency}`;
  }
}

export default function OptimizationResultsPage() {

  const {
    hasProAccess,
    isLoading: isSubscriptionLoading,
  } = useSubscription();

  const [results, setResults] =
    useState<OptimizationResult[]>([]);

  const [summary, setSummary] =
    useState<OptimizationSummary | null>(
      null,
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    capturingSnapshotId,
    setCapturingSnapshotId,
  ] = useState<string | null>(null);

  const [
    snapshotSuccess,
    setSnapshotSuccess,
  ] = useState("");

  const [error, setError] =
    useState("");

  const loadResults =
    useCallback(async () => {
      if (isSubscriptionLoading) {
        return;
      }

      if (!hasProAccess) {
        setResults([]);
        setSummary(null);
        setIsLoading(false);
        setError("");
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          "/api/etsy/optimization-results",
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const data =
          (await response.json()) as OptimizationResultsResponse;

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              "Optimization results could not be loaded.",
          );
        }

        setResults(
          data.results ?? [],
        );

        setSummary(
          data.summary ?? null,
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Optimization results could not be loaded.",
        );
      } finally {
        setIsLoading(false);
      }
    }, [
      hasProAccess,
      isSubscriptionLoading,
    ]);

  async function captureSnapshotNow(
    result: OptimizationResult,
  ) {
    setCapturingSnapshotId(
      result.updateHistoryId,
    );

    setError("");
    setSnapshotSuccess("");

    try {
      const response = await fetch(
        "/api/etsy/optimization-results",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            updateHistoryId:
              result.updateHistoryId,
          }),
        },
      );

      const data =
        (await response.json()) as CaptureManualSnapshotResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "The performance snapshot could not be captured.",
        );
      }

      setSnapshotSuccess(
        `A fresh performance snapshot was captured for Etsy listing ${result.listingId}.`,
      );

      /*
       * Reload the calculated summary and result card so the
       * new manual comparison appears immediately.
       */
      await loadResults();
    } catch (snapshotError) {
      setError(
        snapshotError instanceof Error
          ? snapshotError.message
          : "The performance snapshot could not be captured.",
      );
    } finally {
      setCapturingSnapshotId(
        null,
      );
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadResults();
  }, [loadResults]);

  const totalMeasured =
    useMemo(
      () =>
        results.filter(
          (result) =>
            result.outcome !==
            "pending",
        ).length,
      [results],
    );

  const isActionRunning =
    isLoading ||
    capturingSnapshotId !== null;

    if (isSubscriptionLoading) {
      return (
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BarChart3 className="size-5" />
            </div>
      
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Optimization Results
              </h1>
      
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Measure favorites, orders, units
                sold, and item revenue after
                SellerOS listing updates.
              </p>
            </div>
          </div>
      
          <Card>
            <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              Checking your SellerOS plan…
            </CardContent>
          </Card>
        </div>
      );
    }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <BarChart3 className="size-5" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Optimization Results
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Measure favorites, orders, units
              sold, and item revenue after
              SellerOS listing updates.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={isActionRunning}
          onClick={() => {
            setSnapshotSuccess("");
            void loadResults();
          }}
        >
          <RefreshCw
            className={
              isLoading
                ? "size-4 animate-spin"
                : "size-4"
            }
          />

          Refresh results
        </Button>
      </div>

      {snapshotSuccess ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />

          <div>
            <p className="font-medium">
              Snapshot captured
            </p>

            <p className="mt-1">
              {snapshotSuccess}
            </p>
          </div>
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <Card>
          <CardContent className="flex min-h-56 items-center justify-center">
            <div className="text-center">
              <LoaderCircle className="mx-auto size-8 animate-spin text-primary" />

              <p className="mt-3 text-sm font-medium">
                Loading optimization results…
              </p>
            </div>
          </CardContent>
        </Card>
      ) : results.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
            <Sparkles className="size-10 text-muted-foreground" />

            <p className="mt-4 font-medium">
              No tracked optimizations yet
            </p>

            <p className="mt-2 max-w-lg text-sm text-muted-foreground">
              Generate recommendations and use
              Update on Etsy. SellerOS will save
              a baseline and measure results after
              7, 14, and 30 days.
            </p>

            <Button
              className="mt-5"
              nativeButton={false}
              render={
                <Link href="/listings" />
              }
            >
              Open listings
              <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">
                  Tracked Optimizations
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {summary?.totalOptimizations ??
                    results.length}
                </p>

                <p className="mt-2 text-xs text-muted-foreground">
                  {totalMeasured} with measurable
                  follow-up data
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">
                  Improved
                </p>

                <p className="mt-2 text-3xl font-bold text-emerald-700">
                  {summary?.improved ?? 0}
                </p>

                <p className="mt-2 text-xs text-muted-foreground">
                  Optimizations with positive
                  movement
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">
                  Pending
                </p>

                <p className="mt-2 text-3xl font-bold text-blue-700">
                  {summary?.pending ?? 0}
                </p>

                <p className="mt-2 text-xs text-muted-foreground">
                  Waiting for a comparison
                  snapshot
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">
                  Units Sold Change
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {formatChange(
                    summary?.totalUnitsSoldChange ??
                      0,
                  )}
                </p>

                <p className="mt-2 text-xs text-muted-foreground">
                  Across measured optimizations
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">
                  Favorites change
                </p>

                <p className="mt-2 text-xl font-bold">
                  {formatChange(
                    summary?.totalFavoriteChange ??
                      0,
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">
                  Transactions change
                </p>

                <p className="mt-2 text-xl font-bold">
                  {formatChange(
                    summary?.totalTransactionChange ??
                      0,
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">
                  Mixed results
                </p>

                <p className="mt-2 text-xl font-bold">
                  {summary?.mixed ?? 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">
                  Declined
                </p>

                <p className="mt-2 text-xl font-bold">
                  {summary?.declined ?? 0}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5">
            {results.map(
              (result) => {
                const outcome =
                  getOutcomeDetails(
                    result.outcome,
                  );

                const OutcomeIcon =
                  outcome.icon;

                const updatedFields =
                  getUpdatedFieldNames(
                    result,
                  );

                const currency =
                  result.latestSnapshot
                    ?.revenueCurrency ??
                  result.baseline
                    ?.revenueCurrency ??
                  null;

                const isCapturing =
                  capturingSnapshotId ===
                  result.updateHistoryId;

                const hasManualSnapshot =
                  result.availableStages.includes(
                    "manual",
                  );

                const hasScheduledSnapshot =
                  result.availableStages.some(
                    (stage) =>
                      stage === "day_7" ||
                      stage === "day_14" ||
                      stage === "day_30",
                  );

                return (
                  <Card
                    key={
                      result.updateHistoryId
                    }
                  >
                    <CardHeader>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <CardTitle className="wrap-break-word text-base">
                            {result.listingTitle ||
                              `Etsy listing ${result.listingId}`}
                          </CardTitle>

                          <CardDescription className="mt-1">
                            Updated{" "}
                            {formatDate(
                              result.updatedAt,
                            )}
                          </CardDescription>
                        </div>

                        <span
                          className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${outcome.classes}`}
                        >
                          <OutcomeIcon className="size-3.5" />
                          {outcome.label}
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-5">
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-xl border p-3">
                          <p className="text-xs text-muted-foreground">
                            Favorites
                          </p>

                          <p className="mt-1 text-lg font-semibold">
                            {formatChange(
                              result.changes
                                .favorites,
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl border p-3">
                          <p className="text-xs text-muted-foreground">
                            Transactions
                          </p>

                          <p className="mt-1 text-lg font-semibold">
                            {formatChange(
                              result.changes
                                .transactions,
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl border p-3">
                          <p className="text-xs text-muted-foreground">
                            Units sold
                          </p>

                          <p className="mt-1 text-lg font-semibold">
                            {formatChange(
                              result.changes
                                .unitsSold,
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl border p-3">
                          <p className="text-xs text-muted-foreground">
                            Item revenue
                          </p>

                          <p className="mt-1 text-lg font-semibold">
                            {formatMoney(
                              result.changes
                                .revenue,
                              currency,
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border p-3">
                          <p className="text-xs text-muted-foreground">
                            Fields optimized
                          </p>

                          <p className="mt-1 text-sm font-medium">
                            {updatedFields.length >
                            0
                              ? updatedFields.join(
                                  ", ",
                                )
                              : "None"}
                          </p>
                        </div>

                        <div className="rounded-xl border p-3">
                          <p className="text-xs text-muted-foreground">
                            Latest measurement
                          </p>

                          <p className="mt-1 text-sm font-medium">
                            {result.latestSnapshot
                              ? formatStage(
                                  result
                                    .latestSnapshot
                                    .stage,
                                )
                              : "Waiting for Day 7"}
                          </p>

                          {result.latestSnapshot ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Captured{" "}
                              {formatDate(
                                result
                                  .latestSnapshot
                                  .capturedAt,
                              )}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {result.outcome ===
                      "pending" ? (
                        <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                          <Clock3 className="mt-0.5 size-4 shrink-0" />

                          <div>
                            <p className="font-medium">
                              Performance tracking
                              started
                            </p>

                            <p className="mt-1">
                              The baseline is saved.
                              Capture a manual preview
                              now or wait for the
                              official Day 7
                              measurement.
                            </p>
                          </div>
                        </div>
                      ) : null}

                      {result.latestSnapshot
                        ?.stage ===
                      "manual" ? (
                        <div className="rounded-xl border bg-muted/30 p-3 text-xs leading-5 text-muted-foreground">
                          This is a manual preview.
                          The official Day 7, Day 14,
                          and Day 30 snapshots will
                          replace it as the primary
                          measurement.
                        </div>
                      ) : null}

                      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={
                            isActionRunning
                          }
                          onClick={() =>
                            void captureSnapshotNow(
                              result,
                            )
                          }
                        >
                          {isCapturing ? (
                            <>
                              <LoaderCircle className="size-4 animate-spin" />
                              Capturing…
                            </>
                          ) : (
                            <>
                              <Camera className="size-4" />
                              {hasManualSnapshot &&
                              !hasScheduledSnapshot
                                ? "Refresh snapshot"
                                : "Capture snapshot now"}
                            </>
                          )}
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          nativeButton={false}
                          render={
                            <Link href="/listing-update-history" />
                          }
                        >
                          View update history
                        </Button>

                        <a
                          href={`https://www.etsy.com/listing/${result.listingId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition-all hover:bg-primary/90 sm:col-span-2 xl:col-span-1"
                        >
                          Open Etsy listing

                          <ExternalLink className="size-4" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                );
              },
            )}
          </div>

          <p className="text-xs leading-5 text-muted-foreground">
            Results compare cumulative Etsy
            totals against the baseline saved
            immediately after each update. Manual
            snapshots are previews; scheduled Day
            7, Day 14, and Day 30 measurements take
            priority. Revenue represents item
            revenue returned by Etsy and excludes
            shipping, taxes, fees, refunds, and
            advertising costs.
          </p>
        </>
      )}
    </div>
  );
}