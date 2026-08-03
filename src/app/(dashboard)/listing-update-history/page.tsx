"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  History,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
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

type ListingUpdateHistoryItem = {
  id: string;

  shopId: number;
  shopName: string | null;

  listingId: number;
  listingTitle: string | null;

  updatedFields: {
    title: boolean;
    description: boolean;
    tags: boolean;
  };

  previousValues: {
    title: string | null;
    description: string | null;
    tags: string[];
  };

  newValues: {
    title: string | null;
    description: string | null;
    tags: string[];
  };

  status:
    | "success"
    | "failed";

  error: string | null;
  updatedAt: string;
};

type ListingUpdateHistoryResponse = {
  success: boolean;
  count?: number;
  updates?: ListingUpdateHistoryItem[];
  error?: string;
};

type RestoreListingResponse = {
  success: boolean;
  listingId?: number;
  updatedFields?: {
    title: boolean;
    description: boolean;
    tags: boolean;
  };
  performanceTrackingStarted?: boolean;
  performanceTrackingError?: string | null;
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

function getUpdatedFieldNames(
  update: ListingUpdateHistoryItem,
) {
  const fields: string[] = [];

  if (
    update.updatedFields.title
  ) {
    fields.push("Title");
  }

  if (
    update.updatedFields.description
  ) {
    fields.push("Description");
  }

  if (
    update.updatedFields.tags
  ) {
    fields.push("Tags");
  }

  return fields;
}

function ValueComparison({
  label,
  previousValue,
  newValue,
}: {
  label: string;
  previousValue: string | null;
  newValue: string | null;
}) {
  return (
    <div className="space-y-3 rounded-xl border p-4">
      <p className="text-sm font-medium">
        {label}
      </p>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="min-w-0 rounded-lg bg-muted/40 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Previous
          </p>

          <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm">
            {previousValue ||
              "No previous value"}
          </p>
        </div>

        <div className="min-w-0 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
            New
          </p>

          <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm text-emerald-900">
            {newValue ||
              "No new value"}
          </p>
        </div>
      </div>
    </div>
  );
}

function TagsComparison({
  previousTags,
  newTags,
}: {
  previousTags: string[];
  newTags: string[];
}) {
  return (
    <div className="space-y-3 rounded-xl border p-4">
      <p className="text-sm font-medium">
        Tags
      </p>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="min-w-0 rounded-lg bg-muted/40 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Previous
          </p>

          {previousTags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {previousTags.map(
                (tag, index) => (
                  <span
                    key={`${tag}-${index}`}
                    className="rounded-full border bg-background px-2.5 py-1 text-xs"
                  >
                    {tag}
                  </span>
                ),
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              No previous tags
            </p>
          )}
        </div>

        <div className="min-w-0 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
            New
          </p>

          {newTags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {newTags.map(
                (tag, index) => (
                  <span
                    key={`${tag}-${index}`}
                    className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-xs text-emerald-900"
                  >
                    {tag}
                  </span>
                ),
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-emerald-800">
              No new tags
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ListingUpdateHistoryPage() {
  const [updates, setUpdates] =
    useState<ListingUpdateHistoryItem[]>(
      [],
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

    const [
  restoringUpdateId,
  setRestoringUpdateId,
] = useState<string | null>(null);

const [
  confirmingRestoreId,
  setConfirmingRestoreId,
] = useState<string | null>(null);

const [
  restoreTitle,
  setRestoreTitle,
] = useState(false);

const [
  restoreDescription,
  setRestoreDescription,
] = useState(false);

const [
  restoreTags,
  setRestoreTags,
] = useState(false);

const [
  restoreSuccess,
  setRestoreSuccess,
] = useState("");

  const loadUpdateHistory =
    useCallback(async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          "/api/etsy/listing-update-history",
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const data =
          (await response.json()) as ListingUpdateHistoryResponse;

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              "The Etsy listing update history could not be loaded.",
          );
        }

        setUpdates(
          data.updates ?? [],
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "The Etsy listing update history could not be loaded.",
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

    function openRestoreConfirmation(
  update: ListingUpdateHistoryItem,
) {
  const canRestoreTitle =
    update.updatedFields.title &&
    Boolean(
      update.previousValues.title?.trim(),
    );

  const canRestoreDescription =
    update.updatedFields.description &&
    Boolean(
      update.previousValues.description?.trim(),
    );

  const canRestoreTags =
    update.updatedFields.tags &&
    update.previousValues.tags.length > 0;

  setRestoreTitle(
    canRestoreTitle,
  );

  setRestoreDescription(
    canRestoreDescription,
  );

  setRestoreTags(
    canRestoreTags,
  );

  setError("");
  setRestoreSuccess("");

  setConfirmingRestoreId(
    update.id,
  );
}

function cancelRestore() {
  if (restoringUpdateId) {
    return;
  }

  setConfirmingRestoreId(
    null,
  );

  setRestoreTitle(false);
  setRestoreDescription(false);
  setRestoreTags(false);
  setError("");
}

async function restorePreviousValues(
  update: ListingUpdateHistoryItem,
) {
  if (
    !restoreTitle &&
    !restoreDescription &&
    !restoreTags
  ) {
    setError(
      "Select at least one previous value to restore.",
    );

    return;
  }

  setRestoringUpdateId(
    update.id,
  );

  setError("");
  setRestoreSuccess("");

  try {
    const response = await fetch(
      "/api/etsy/update-listing-content",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          listingId:
            update.listingId,

          updateTitle:
            restoreTitle,

          updateDescription:
            restoreDescription,

          updateTags:
            restoreTags,

          title:
            update.previousValues.title ??
            "",

          description:
            update.previousValues.description ??
            "",

          tags:
            update.previousValues.tags,
        }),
      },
    );

    const data =
      (await response.json()) as RestoreListingResponse;

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data.error ||
          "The previous Etsy values could not be restored.",
      );
    }

    const restoredFields: string[] =
      [];

    if (
      data.updatedFields?.title
    ) {
      restoredFields.push(
        "title",
      );
    }

    if (
      data.updatedFields
        ?.description
    ) {
      restoredFields.push(
        "description",
      );
    }

    if (
      data.updatedFields?.tags
    ) {
      restoredFields.push(
        "tags",
      );
    }

    setRestoreSuccess(
      `Previous ${restoredFields.join(
        ", ",
      )} restored on Etsy listing ${update.listingId}.`,
    );

    setConfirmingRestoreId(
      null,
    );

    setRestoreTitle(false);
    setRestoreDescription(false);
    setRestoreTags(false);

    await loadUpdateHistory();
  } catch (restoreError) {
    setError(
      restoreError instanceof Error
        ? restoreError.message
        : "The previous Etsy values could not be restored.",
    );
  } finally {
    setRestoringUpdateId(
      null,
    );
  }
}

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadUpdateHistory();
  }, [loadUpdateHistory]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <History className="size-5" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Etsy Listing Update History
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Review manual listing changes
              sent from SellerOS to Etsy.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={isLoading}
          onClick={() =>
            void loadUpdateHistory()
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

      {restoreSuccess ? (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />

            <div>
              <p className="font-medium">
                Previous values restored
              </p>

              <p className="mt-1">
                {restoreSuccess}
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
                Loading update history…
              </p>
            </div>
          </CardContent>
        </Card>
      ) : updates.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
            <History className="size-10 text-muted-foreground" />

            <p className="mt-4 font-medium">
              No Etsy listing updates yet
            </p>

            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Manual title, description,
              and tag updates sent to Etsy
              will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {updates.map(
            (update) => {
              const updatedFieldNames =
                getUpdatedFieldNames(
                  update,
                );

              const isSuccessful =
                update.status ===
                "success";

              const canRestoreTitle =
                isSuccessful &&
                update.updatedFields.title &&
                Boolean(
                  update.previousValues.title?.trim(),
                );
            
              const canRestoreDescription =
                isSuccessful &&
                update.updatedFields.description &&
                Boolean(
                  update.previousValues.description?.trim(),
                );
            
              const canRestoreTags =
                isSuccessful &&
                update.updatedFields.tags &&
                update.previousValues.tags.length > 0;
            
              const canRestoreAnything =
                canRestoreTitle ||
                canRestoreDescription ||
                canRestoreTags;
            
              const isConfirmingRestore =
                confirmingRestoreId ===
                update.id;
            
              const isRestoring =
                restoringUpdateId ===
                update.id;

              return (
                <Card key={update.id}>
                  <CardHeader>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <CardTitle className="wrap-break-word text-base">
                          {update.listingTitle ||
                            `Etsy listing ${update.listingId}`}
                        </CardTitle>

                        <CardDescription className="mt-1">
                          Updated{" "}
                          {formatDate(
                            update.updatedAt,
                          )}
                        </CardDescription>
                      </div>

                      <span
                        className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                          isSuccessful
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {isSuccessful ? (
                          <CheckCircle2 className="size-3.5" />
                        ) : (
                          <AlertTriangle className="size-3.5" />
                        )}

                        {isSuccessful
                          ? "Successful"
                          : "Failed"}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border p-3">
                        <p className="text-xs text-muted-foreground">
                          Etsy listing ID
                        </p>

                        <p className="mt-1 text-sm font-medium">
                          {update.listingId}
                        </p>
                      </div>

                      <div className="rounded-xl border p-3">
                        <p className="text-xs text-muted-foreground">
                          Fields selected
                        </p>

                        <p className="mt-1 text-sm font-medium">
                          {updatedFieldNames.length >
                          0
                            ? updatedFieldNames.join(
                                ", ",
                              )
                            : "None"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Store className="size-4 shrink-0" />

                      <span className="truncate">
                        {update.shopName ||
                          `Shop ${update.shopId}`}
                      </span>
                    </div>

                    {!isSuccessful &&
                    update.error ? (
                      <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />

                        <div>
                          <p className="font-medium">
                            Etsy update failed
                          </p>

                          <p className="mt-1 wrap-break-word">
                            {update.error}
                          </p>
                        </div>
                      </div>
                    ) : null}

                    <div className="space-y-4">
                      {update.updatedFields
                        .title ? (
                        <ValueComparison
                          label="Title"
                          previousValue={
                            update
                              .previousValues
                              .title
                          }
                          newValue={
                            update.newValues
                              .title
                          }
                        />
                      ) : null}

                      {update.updatedFields
                        .description ? (
                        <ValueComparison
                          label="Description"
                          previousValue={
                            update
                              .previousValues
                              .description
                          }
                          newValue={
                            update.newValues
                              .description
                          }
                        />
                      ) : null}

                      {update.updatedFields
                        .tags ? (
                        <TagsComparison
                          previousTags={
                            update
                              .previousValues
                              .tags
                          }
                          newTags={
                            update.newValues
                              .tags
                          }
                        />
                      ) : null}
                    </div>

                    {isConfirmingRestore ? (
                      <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <div className="flex items-start gap-3 text-amber-900">
                          <AlertTriangle className="mt-0.5 size-5 shrink-0" />
                                        
                          <div>
                            <p className="font-medium">
                              Restore previous Etsy values?
                            </p>
                                        
                            <p className="mt-1 text-sm">
                              Selected values from this history
                              record will overwrite the listing’s
                              current Etsy content.
                            </p>
                          </div>
                        </div>
                                        
                        <div className="space-y-3">
                          <label className="flex items-start gap-3 rounded-lg border bg-white p-3">
                            <input
                              type="checkbox"
                              checked={restoreTitle}
                              disabled={
                                !canRestoreTitle ||
                                isRestoring
                              }
                              onChange={(event) =>
                                setRestoreTitle(
                                  event.target.checked,
                                )
                              }
                              className="mt-1 size-4"
                            />
                    
                            <span className="min-w-0">
                              <span className="block text-sm font-medium">
                                Restore title
                              </span>
                          
                              <span className="mt-1 block wrap-break-word text-xs text-muted-foreground">
                                {canRestoreTitle
                                  ? update.previousValues.title
                                  : "No previous title is available."}
                              </span>
                            </span>
                          </label>
                                
                          <label className="flex items-start gap-3 rounded-lg border bg-white p-3">
                            <input
                              type="checkbox"
                              checked={restoreDescription}
                              disabled={
                                !canRestoreDescription ||
                                isRestoring
                              }
                              onChange={(event) =>
                                setRestoreDescription(
                                  event.target.checked,
                                )
                              }
                              className="mt-1 size-4"
                            />
                    
                            <span>
                              <span className="block text-sm font-medium">
                                Restore description
                              </span>
                          
                              <span className="mt-1 block text-xs text-muted-foreground">
                                {canRestoreDescription
                                  ? `${update.previousValues.description?.length ?? 0} characters`
                                  : "No previous description is available."}
                              </span>
                            </span>
                          </label>
                                
                          <label className="flex items-start gap-3 rounded-lg border bg-white p-3">
                            <input
                              type="checkbox"
                              checked={restoreTags}
                              disabled={
                                !canRestoreTags ||
                                isRestoring
                              }
                              onChange={(event) =>
                                setRestoreTags(
                                  event.target.checked,
                                )
                              }
                              className="mt-1 size-4"
                            />
                    
                            <span>
                              <span className="block text-sm font-medium">
                                Restore tags
                              </span>
                          
                              <span className="mt-1 block text-xs text-muted-foreground">
                                {canRestoreTags
                                  ? `${update.previousValues.tags.length} previous tags`
                                  : "No previous tags are available."}
                              </span>
                            </span>
                          </label>
                        </div>
                                
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Button
                            type="button"
                            variant="outline"
                            disabled={isRestoring}
                            onClick={cancelRestore}
                          >
                            Cancel
                          </Button>
                                
                          <Button
                            type="button"
                            disabled={
                              isRestoring ||
                              (!restoreTitle &&
                                !restoreDescription &&
                                !restoreTags)
                            }
                            onClick={() =>
                              void restorePreviousValues(
                                update,
                              )
                            }
                          >
                            {isRestoring ? (
                              <>
                                <LoaderCircle className="size-4 animate-spin" />
                                Restoring…
                              </>
                            ) : (
                              <>
                                <RotateCcw className="size-4" />
                                Confirm restore
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={
                            !canRestoreAnything ||
                            restoringUpdateId !== null
                          }
                          onClick={() =>
                            openRestoreConfirmation(
                              update,
                            )
                          }
                        >
                          <RotateCcw className="size-4" />
                          Restore previous values
                        </Button>
                      
                        <a
                          href={`https://www.etsy.com/listing/${update.listingId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition-all hover:bg-primary/90"
                        >
                          Open Etsy listing
                      
                          <ExternalLink className="size-4" />
                        </a>
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