"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileClock,
  ImageIcon,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  Sparkles,
  Store,
  Trash2,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useSubscription } from "@/hooks/useSubscription";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ExportHistoryItem = {
  id: string;
  sourceProjectId: string | null;
  shopId: number;
  shopName: string | null;
  listingId: number;
  listingTitle: string;
  listingUrl: string | null;
  uploadedImageCount: number;
  state: string;
  projectCleanupCompleted: boolean;
  projectCleanupError: string | null;
  exportedAt: string;
  lastEtsySyncedAt: string | null;
};

type ExportHistoryResponse = {
  success: boolean;
  exports?: ExportHistoryItem[];
  error?: string;
};

type RetryCleanupResponse = {
  success: boolean;
  historyId?: string;
  cleanupCompleted?: boolean;
  projectAlreadyMissing?: boolean;
  deletedStorageFileCount?: number;
  error?: string;
};

type SyncEtsyStatusResponse = {
  success: boolean;
  historyId?: string;
  listingId?: number;
  listingTitle?: string;
  listingUrl?: string | null;
  state?: string;
  lastEtsySyncedAt?: string;
  error?: string;
};

type SyncAllResult = {
  historyId: string;
  listingId: number;
  success: boolean;
  state?: string;
  listingTitle?: string;
  listingUrl?: string | null;
  lastEtsySyncedAt?: string;
  error?: string;
};

type SyncAllResponse = {
  success: boolean;
  totalCount?: number;
  successfulCount?: number;
  failedCount?: number;
  results?: SyncAllResult[];
  error?: string;
};

type SyncSummary = {
  successfulCount: number;
  failedCount: number;
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

function getStateClasses(
  state: string,
) {
  switch (
    state.toLowerCase()
  ) {
    case "active":
      return "bg-emerald-100 text-emerald-700";

    case "draft":
      return "bg-blue-100 text-blue-700";

    case "inactive":
      return "bg-amber-100 text-amber-700";

    case "sold_out":
      return "bg-violet-100 text-violet-700";

    case "expired":
      return "bg-orange-100 text-orange-700";

    case "deleted":
      return "bg-destructive/10 text-destructive";

    default:
      return "bg-muted text-muted-foreground";
  }
}

function formatStateLabel(
  state: string,
) {
  return state
    .replaceAll("_", " ")
    .trim();
}

function getEtsyListingUrl(
  exportItem: ExportHistoryItem,
) {
  const normalizedState =
    exportItem.state.toLowerCase();

  if (normalizedState === "draft") {
    return `https://www.etsy.com/your/shops/me/listing-editor/edit/${exportItem.listingId}`;
  }

  return (
    exportItem.listingUrl ||
    `https://www.etsy.com/listing/${exportItem.listingId}`
  );
}

export default function ExportHistoryPage() {

  const {
    hasProAccess,
    isLoading: isSubscriptionLoading,
  } = useSubscription();

  const [exports, setExports] =
    useState<ExportHistoryItem[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    retryingCleanupId,
    setRetryingCleanupId,
  ] = useState<string | null>(null);

  const [
    syncingStatusId,
    setSyncingStatusId,
  ] = useState<string | null>(null);

  const [
    isSyncingAll,
    setIsSyncingAll,
  ] = useState(false);

  const [
    syncSummary,
    setSyncSummary,
  ] = useState<SyncSummary | null>(
    null,
  );

  const [error, setError] =
    useState("");

  const loadExportHistory =
    useCallback(async () => {
      if (isSubscriptionLoading) {
        return;
      }

      if (!hasProAccess) {
        setExports([]);
        setIsLoading(false);
        setError("");
        setSyncSummary(null);
        return;
      }

      setIsLoading(true);
      setError("");
      setSyncSummary(null);

      try {
        const response = await fetch(
          "/api/etsy/export-history",
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const data =
          (await response.json()) as ExportHistoryResponse;

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              "Etsy export history could not be loaded.",
          );
        }

        setExports(
          data.exports ?? [],
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Etsy export history could not be loaded.",
        );
      } finally {
        setIsLoading(false);
      }
    }, [
      hasProAccess,
      isSubscriptionLoading,
    ]);

  async function retryCleanup(
    historyId: string,
  ) {
    setRetryingCleanupId(
      historyId,
    );

    setError("");
    setSyncSummary(null);

    try {
      const response = await fetch(
        `/api/etsy/export-history/${encodeURIComponent(
          historyId,
        )}/retry-cleanup`,
        {
          method: "POST",
        },
      );

      const data =
        (await response.json()) as RetryCleanupResponse;

      if (
        !response.ok ||
        !data.success ||
        !data.cleanupCompleted
      ) {
        throw new Error(
          data.error ||
            "The SellerOS project cleanup could not be completed.",
        );
      }

      setExports(
        (currentExports) =>
          currentExports.map(
            (exportItem) =>
              exportItem.id ===
              historyId
                ? {
                    ...exportItem,
                    projectCleanupCompleted:
                      true,
                    projectCleanupError:
                      null,
                  }
                : exportItem,
          ),
      );
    } catch (cleanupError) {
      const message =
        cleanupError instanceof Error
          ? cleanupError.message
          : "The SellerOS project cleanup could not be completed.";

      setError(message);

      setExports(
        (currentExports) =>
          currentExports.map(
            (exportItem) =>
              exportItem.id ===
              historyId
                ? {
                    ...exportItem,
                    projectCleanupError:
                      message,
                  }
                : exportItem,
          ),
      );
    } finally {
      setRetryingCleanupId(
        null,
      );
    }
  }

  async function syncEtsyStatus(
    historyId: string,
  ) {
    setSyncingStatusId(
      historyId,
    );

    setError("");
    setSyncSummary(null);

    try {
      const response = await fetch(
        "/api/etsy/export-history",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            historyId,
          }),
        },
      );

      const data =
        (await response.json()) as SyncEtsyStatusResponse;

      if (
        !response.ok ||
        !data.success ||
        !data.state
      ) {
        throw new Error(
          data.error ||
            "The Etsy listing status could not be synchronized.",
        );
      }

      setExports(
        (currentExports) =>
          currentExports.map(
            (exportItem) =>
              exportItem.id ===
              historyId
                ? {
                    ...exportItem,
                    state:
                      data.state ??
                      exportItem.state,
                    listingTitle:
                      data.listingTitle ??
                      exportItem.listingTitle,
                    listingUrl:
                      data.listingUrl ??
                      exportItem.listingUrl,
                    lastEtsySyncedAt:
                      data.lastEtsySyncedAt ??
                      exportItem.lastEtsySyncedAt,
                  }
                : exportItem,
          ),
      );
    } catch (syncError) {
      setError(
        syncError instanceof Error
          ? syncError.message
          : "The Etsy listing status could not be synchronized.",
      );
    } finally {
      setSyncingStatusId(
        null,
      );
    }
  }

  async function syncAllEtsyStatuses() {
    setIsSyncingAll(true);
    setError("");
    setSyncSummary(null);

    try {
      const response = await fetch(
        "/api/etsy/export-history/sync-all",
        {
          method: "POST",
        },
      );

      const data =
        (await response.json()) as SyncAllResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Etsy listing statuses could not be synchronized.",
        );
      }

      const results =
        data.results ?? [];

      setExports(
        (currentExports) =>
          currentExports.map(
            (exportItem) => {
              const result =
                results.find(
                  (item) =>
                    item.historyId ===
                    exportItem.id,
                );

              if (
                !result ||
                !result.success
              ) {
                return exportItem;
              }

              return {
                ...exportItem,
                state:
                  result.state ??
                  exportItem.state,
                listingTitle:
                  result.listingTitle ??
                  exportItem.listingTitle,
                listingUrl:
                  result.listingUrl ??
                  exportItem.listingUrl,
                lastEtsySyncedAt:
                  result.lastEtsySyncedAt ??
                  exportItem.lastEtsySyncedAt,
              };
            },
          ),
      );

      setSyncSummary({
        successfulCount:
          data.successfulCount ?? 0,
        failedCount:
          data.failedCount ?? 0,
      });
    } catch (syncError) {
      setError(
        syncError instanceof Error
          ? syncError.message
          : "Etsy listing statuses could not be synchronized.",
      );
    } finally {
      setIsSyncingAll(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadExportHistory();
  }, [loadExportHistory]);

  const isActionRunning =
    retryingCleanupId !== null ||
    syncingStatusId !== null ||
    isSyncingAll;

  if (isSubscriptionLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <FileClock className="size-5" />
          </div>
    
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Etsy Export History
            </h1>
    
            <p className="mt-1 text-sm text-muted-foreground">
              Review exported listings and
              synchronize their current Etsy
              status.
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
  
  if (!hasProAccess) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <FileClock className="size-5" />
          </div>
    
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Etsy Export History
            </h1>
    
            <p className="mt-1 text-sm text-muted-foreground">
              Review exported listings and
              synchronize their current Etsy
              status.
            </p>
          </div>
        </div>
    
        <Card className="border-primary/20">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <LockKeyhole className="size-5" />
                </div>
    
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">
                      Etsy Export History requires SellerOS Pro
                    </h2>
    
                    <span className="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-2 py-0.5 text-xs font-medium">
                      <Sparkles className="size-3" />
                      Pro
                    </span>
                  </div>
    
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Upgrade to export SellerOS
                    listings to Etsy, review export
                    records, synchronize Etsy
                    listing status, and retry project
                    cleanup when needed.
                  </p>
    
                  <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      Etsy draft export history
                    </div>
    
                    <div className="rounded-lg border bg-muted/20 p-3">
                      Listing status synchronization
                    </div>
    
                    <div className="rounded-lg border bg-muted/20 p-3">
                      Exported image tracking
                    </div>
    
                    <div className="rounded-lg border bg-muted/20 p-3">
                      Project cleanup recovery
                    </div>
                  </div>
                </div>
              </div>
    
              <Button
                nativeButton={false}
                size="lg"
                className="w-full shrink-0 lg:w-auto"
                render={
                  <Link href="/subscription" />
                }
              >
                <Sparkles className="size-4" />
                Upgrade to Pro
              </Button>
            </div>
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
            <FileClock className="size-5" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Etsy Export History
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Review exported listings and
              synchronize their current Etsy
              status.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            disabled={
              isLoading ||
              isActionRunning ||
              exports.length === 0
            }
            onClick={() =>
              void syncAllEtsyStatuses()
            }
          >
            {isSyncingAll ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Syncing all…
              </>
            ) : (
              <>
                <RefreshCw className="size-4" />
                Sync all statuses
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={
              isLoading ||
              isActionRunning
            }
            onClick={() =>
              void loadExportHistory()
            }
          >
            <RefreshCw
              className={
                isLoading
                  ? "size-4 animate-spin"
                  : "size-4"
              }
            />
            Refresh history
          </Button>
        </div>
      </div>

      {syncSummary ? (
        <div
          className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
            syncSummary.failedCount > 0
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {syncSummary.failedCount > 0 ? (
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          )}

          <div>
            <p className="font-medium">
              Etsy status sync completed
            </p>

            <p className="mt-1">
              {
                syncSummary.successfulCount
              }{" "}
              synced successfully
              {syncSummary.failedCount > 0
                ? `, ${syncSummary.failedCount} failed.`
                : "."}
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
          <CardContent className="flex min-h-48 items-center justify-center">
            <div className="text-center">
              <LoaderCircle className="mx-auto size-8 animate-spin text-primary" />

              <p className="mt-3 text-sm font-medium">
                Loading export history…
              </p>
            </div>
          </CardContent>
        </Card>
      ) : exports.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
            <FileClock className="size-10 text-muted-foreground" />

            <p className="mt-4 font-medium">
              No Etsy exports yet
            </p>

            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Listings exported from SellerOS
              will appear here after the Etsy
              draft and images are created.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {exports.map(
            (exportItem) => {
              const isRetrying =
                retryingCleanupId ===
                exportItem.id;

              const isSyncing =
                syncingStatusId ===
                exportItem.id;

              const normalizedState =
                exportItem.state.toLowerCase();

              const isDeleted =
                normalizedState ===
                "deleted";

              const isDraft =
                normalizedState ===
                "draft";

              const etsyListingUrl =
                getEtsyListingUrl(
                  exportItem,
                );

              return (
                <Card key={exportItem.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">
                          {
                            exportItem.listingTitle
                          }
                        </CardTitle>

                        <CardDescription className="mt-1">
                          Exported{" "}
                          {formatDate(
                            exportItem.exportedAt,
                          )}
                        </CardDescription>

                        <CardDescription className="mt-1">
                          {exportItem.lastEtsySyncedAt
                            ? `Last synced ${formatDate(
                                exportItem.lastEtsySyncedAt,
                              )}`
                            : "Not synced with Etsy yet"}
                        </CardDescription>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStateClasses(
                          exportItem.state,
                        )}`}
                      >
                        {formatStateLabel(
                          exportItem.state,
                        )}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border p-3">
                        <p className="text-xs text-muted-foreground">
                          Etsy listing ID
                        </p>

                        <p className="mt-1 truncate text-sm font-medium">
                          {
                            exportItem.listingId
                          }
                        </p>
                      </div>

                      <div className="rounded-xl border p-3">
                        <p className="text-xs text-muted-foreground">
                          Images uploaded
                        </p>

                        <p className="mt-1 flex items-center gap-2 text-sm font-medium">
                          <ImageIcon className="size-4 text-muted-foreground" />
                          {
                            exportItem.uploadedImageCount
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Store className="size-4 shrink-0" />

                      <span className="truncate">
                        {exportItem.shopName ||
                          `Shop ${exportItem.shopId}`}
                      </span>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={
                        isActionRunning
                      }
                      onClick={() =>
                        void syncEtsyStatus(
                          exportItem.id,
                        )
                      }
                    >
                      {isSyncing ? (
                        <>
                          <LoaderCircle className="size-4 animate-spin" />
                          Syncing Etsy status…
                        </>
                      ) : (
                        <>
                          <RefreshCw className="size-4" />
                          Sync Etsy status
                        </>
                      )}
                    </Button>

                    {isDeleted ? (
                      <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />

                        <div>
                          <p className="font-medium">
                            Etsy listing deleted
                          </p>

                          <p className="mt-1">
                            Etsy no longer returns
                            this listing. Its export
                            record remains available
                            in SellerOS.
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {exportItem.projectCleanupCompleted ? (
                      <div className="rounded-xl border bg-muted/20 p-3 text-sm text-muted-foreground">
                        SellerOS project files were
                        deleted successfully after
                        export.
                      </div>
                    ) : (
                      <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="mt-0.5 size-4 shrink-0" />

                          <div>
                            <p className="font-medium">
                              Project cleanup incomplete
                            </p>

                            <p className="mt-1">
                              {exportItem.projectCleanupError ||
                                "The SellerOS project could not be deleted automatically."}
                            </p>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          className="w-full border-amber-300 bg-white text-amber-900 hover:bg-amber-100 hover:text-amber-900"
                          disabled={
                            isActionRunning
                          }
                          onClick={() =>
                            void retryCleanup(
                              exportItem.id,
                            )
                          }
                        >
                          {isRetrying ? (
                            <>
                              <LoaderCircle className="size-4 animate-spin" />
                              Retrying cleanup…
                            </>
                          ) : (
                            <>
                              <Trash2 className="size-4" />
                              Retry project cleanup
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {!isDeleted ? (
                      <a
                        href={etsyListingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 w-full items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition-all hover:bg-primary/90"
                      >
                        {isDraft
                          ? "Edit Etsy draft"
                          : "Open Etsy listing"}

                        <ExternalLink className="size-4" />
                      </a>
                    ) : (
                      <div className="rounded-xl border p-3 text-center text-sm text-muted-foreground">
                        This listing is no longer
                        available on Etsy.
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            },
          )}
        </div>
      )}
    </div>
  );
}