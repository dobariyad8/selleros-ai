"use client";

import {
  AlertTriangle,
  ExternalLink,
  FileClock,
  ImageIcon,
  LoaderCircle,
  RefreshCw,
  Store,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

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
};

type ExportHistoryResponse = {
  success: boolean;
  exports?: ExportHistoryItem[];
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

    default:
      return "bg-muted text-muted-foreground";
  }
}

export default function ExportHistoryPage() {
  const [exports, setExports] =
    useState<ExportHistoryItem[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadExportHistory =
    useCallback(async () => {
      setIsLoading(true);
      setError("");

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
    }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadExportHistory();
  }, [loadExportHistory]);

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
              Review listings exported from
              SellerOS to your Etsy shop.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={isLoading}
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
          Refresh
        </Button>
      </div>

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
            (exportItem) => (
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
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStateClasses(
                        exportItem.state,
                      )}`}
                    >
                      {exportItem.state}
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

                  {exportItem.projectCleanupCompleted ? (
                    <div className="rounded-xl border bg-muted/20 p-3 text-sm text-muted-foreground">
                      SellerOS project files were
                      deleted successfully after
                      export.
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
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
                  )}

                  {exportItem.listingUrl ? (
                    <a
                      href={
                        exportItem.listingUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 w-full items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition-all hover:bg-primary/90"
                    >
                      Open Etsy listing
                      <ExternalLink className="size-4" />
                    </a>
                  ) : (
                    <div className="rounded-xl border p-3 text-center text-sm text-muted-foreground">
                      Etsy did not provide a direct
                      listing URL.
                    </div>
                  )}
                </CardContent>
              </Card>
            ),
          )}
        </div>
      )}
    </div>
  );
}