"use client";

import {
  Clock3,
  FileText,
  ImageIcon,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/useSubscription";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ListingProjectSummary = {
  id: string;
  status: string;
  productName: string;
  productType: string | null;
  price: number | null;
  quantity: number;
  generatedTitle: string | null;
  generatedDescription: string | null;
  generatedTags: string[];
  generatedMaterials: string[];
  generatedHighlights: string[];
  imagePlan: unknown[];
  sourceImageCount: number;
  generatedImageCount: number;
  etsyListingId: number | null;
  etsyListingUrl: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
};

type ListingProjectsResponse = {
  success: boolean;
  projects?: ListingProjectSummary[];
  error?: string;
};

type DeleteListingProjectResponse = {
  success: boolean;
  projectId?: string;
  error?: string;
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
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

function getExpirationDetails(
  value: string,
) {
  const expirationDate =
    new Date(value);

  if (
    Number.isNaN(
      expirationDate.getTime(),
    )
  ) {
    return {
      label:
        "Expiration date unavailable",
      dateLabel: "Unknown",
      isUrgent: false,
    };
  }

  const millisecondsRemaining =
    expirationDate.getTime() -
    Date.now();

  const daysRemaining =
    Math.max(
      0,
      Math.ceil(
        millisecondsRemaining /
          (1000 * 60 * 60 * 24),
      ),
    );

  let label =
    `Deletes in ${daysRemaining} days`;

  if (daysRemaining === 0) {
    label = "Scheduled for deletion";
  } else if (daysRemaining === 1) {
    label = "Deletes in 1 day";
  }

  return {
    label,
    dateLabel:
      formatDate(value),
    isUrgent:
      daysRemaining <= 1,
  };
}

function formatPrice(
  value: number | null,
) {
  if (value === null) {
    return "Not set";
  }

  return new Intl.NumberFormat(
    undefined,
    {
      style: "currency",
      currency: "USD",
    },
  ).format(value);
}

function getStatusClasses(
  status: string,
) {
  switch (status) {
    case "ready":
      return "bg-emerald-100 text-emerald-700";

    case "exported":
      return "bg-blue-100 text-blue-700";

    case "failed":
      return "bg-destructive/10 text-destructive";

    case "generating":
    case "exporting":
      return "bg-amber-100 text-amber-700";

    default:
      return "bg-muted text-muted-foreground";
  }
}

export default function ListingProjectsPage() {
  const {
    hasProAccess,
    isLoading: isSubscriptionLoading,
  } = useSubscription();

  const [projects, setProjects] =
    useState<ListingProjectSummary[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    confirmDeleteProjectId,
    setConfirmDeleteProjectId,
  ] = useState<string | null>(null);
  
  const [
    deletingProjectId,
    setDeletingProjectId,
  ] = useState<string | null>(null);

  const loadProjects =
    useCallback(async () => {
      if (isSubscriptionLoading) {
        return;
      }

      if (!hasProAccess) {
        setProjects([]);
        setIsLoading(false);
        setError("");
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          "/api/listing-projects",
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const data =
          (await response.json()) as ListingProjectsResponse;

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              "Listing projects could not be loaded.",
          );
        }

        setProjects(
          data.projects ?? [],
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Listing projects could not be loaded.",
        );
      } finally {
        setIsLoading(false);
      }
    }, [
      hasProAccess,
      isSubscriptionLoading,
    ]);

    async function deleteProject(
      projectId: string,
    ) {
      setDeletingProjectId(
        projectId,
      );

      setError("");

      try {
        const response = await fetch(
          `/api/listing-projects/${encodeURIComponent(
            projectId,
          )}`,
          {
            method: "DELETE",
          },
        );

        const data =
          (await response.json()) as DeleteListingProjectResponse;

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              "The listing project could not be deleted.",
          );
        }

        setProjects(
          (currentProjects) =>
            currentProjects.filter(
              (project) =>
                project.id !==
                projectId,
            ),
        );

        setConfirmDeleteProjectId(
          null,
        );
      } catch (deleteError) {
        setError(
          deleteError instanceof Error
            ? deleteError.message
            : "The listing project could not be deleted.",
        );
      } finally {
        setDeletingProjectId(
          null,
        );
      }
    }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProjects();
  }, [loadProjects]);

  if (isSubscriptionLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <FileText className="size-5" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              My Listing Projects
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Reopen saved listing drafts and
              continue generating images.
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
            <FileText className="size-5" />
          </div>
    
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              My Listing Projects
            </h1>
    
            <p className="mt-1 text-sm text-muted-foreground">
              Reopen saved listing drafts and
              continue generating images.
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
                      Listing Projects requires SellerOS Pro
                    </h2>
    
                    <span className="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-2 py-0.5 text-xs font-medium">
                      <Sparkles className="size-3" />
                      Pro
                    </span>
                  </div>
    
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Upgrade to save, reopen, edit,
                    regenerate, and manage your AI
                    listing projects.
                  </p>
    
                  <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      Saved AI listing drafts
                    </div>
    
                    <div className="rounded-lg border bg-muted/20 p-3">
                      Source product photos
                    </div>
    
                    <div className="rounded-lg border bg-muted/20 p-3">
                      Generated listing images
                    </div>
    
                    <div className="rounded-lg border bg-muted/20 p-3">
                      Etsy export workflow
                    </div>
                  </div>
                </div>
              </div>
    
              <Link
                href="/subscription"
                className={cn(
                  "inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-xs transition-all hover:bg-primary/90 lg:w-auto",
                )}
              >
                <Sparkles className="size-4" />
                Upgrade to Pro
              </Link>
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
            <FileText className="size-5" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              My Listing Projects
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Reopen saved listing drafts and
              continue generating images.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() =>
              void loadProjects()
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

          <Link
            href="/create-listing"
            className={cn(
              "inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition-all hover:bg-primary/90",
            )}
          >
            <Sparkles className="size-4" />
            Create listing
          </Link>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <Clock3 className="mt-0.5 size-4 shrink-0" />
              
        <div>
          <p className="font-medium">
            Projects are stored temporarily
          </p>
              
          <p className="mt-1">
            Listing projects are scheduled for
            automatic deletion five days after
            their most recent update. Saving,
            regenerating, or editing a project
            extends its expiration.
          </p>
        </div>
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
                Loading listing projects…
              </p>
            </div>
          </CardContent>
        </Card>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
            <FileText className="size-10 text-muted-foreground" />

            <p className="mt-4 font-medium">
              No listing projects yet
            </p>

            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Generate your first AI listing
              package and it will appear here.
            </p>

            <Link
              href="/create-listing"
              className={cn(
                "mt-5 inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition-all hover:bg-primary/90",
              )}
            >
              <Sparkles className="size-4" />
              Create first listing
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {projects.map((project) => {
              const expiration =
                getExpirationDetails(
                  project.expiresAt,
                );
            
              return (
                <Card key={project.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base">
                      {project.generatedTitle ||
                        project.productName}
                    </CardTitle>

                    <CardDescription className="mt-1">
                      Updated{" "}
                      {formatDate(
                        project.updatedAt,
                      )}
                    </CardDescription>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStatusClasses(
                      project.status,
                    )}`}
                  >
                    {project.status}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border p-3">
                    <p className="text-xs text-muted-foreground">
                      Price
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {formatPrice(
                        project.price,
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border p-3">
                    <p className="text-xs text-muted-foreground">
                      Quantity
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {project.quantity}
                    </p>
                  </div>

                  <div className="rounded-xl border p-3">
                    <p className="text-xs text-muted-foreground">
                      Source photos
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {
                        project.sourceImageCount
                      }
                    </p>
                  </div>

                  <div className="rounded-xl border p-3">
                    <p className="text-xs text-muted-foreground">
                      AI images
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {
                        project.generatedImageCount
                      }
                      /6
                    </p>
                  </div>
                </div>

                <div
                  className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${
                    expiration.isUrgent
                      ? "border-destructive/30 bg-destructive/5 text-destructive"
                      : "bg-muted/20 text-muted-foreground"
                  }`}
                >
                  <Clock3 className="mt-0.5 size-4 shrink-0" />
              
                  <div>
                    <p className="font-medium">
                      {expiration.label}
                    </p>
              
                    <p className="mt-1 text-xs">
                      Scheduled:{" "}
                      {expiration.dateLabel}
                    </p>
                  </div>
                </div>

                {project.productType ? (
                  <p className="text-sm text-muted-foreground">
                    Product type:{" "}
                    <span className="font-medium text-foreground">
                      {project.productType}
                    </span>
                  </p>
                ) : null}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ImageIcon className="size-4" />
                  {
                    project.generatedImageCount
                  }{" "}
                  generated listing images saved
                </div>

                <div className="space-y-2">
                  <Link
                    href={`/create-listing?projectId=${encodeURIComponent(
                      project.id,
                    )}`}
                    className={cn(
                      "inline-flex h-9 w-full items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition-all hover:bg-primary/90",
                    )}
                  >
                    Open project
                  </Link>
                
                  {confirmDeleteProjectId ===
                  project.id ? (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                      <p className="text-sm font-medium text-destructive">
                        Permanently delete this project?
                      </p>
                
                      <p className="mt-1 text-xs text-muted-foreground">
                        Its listing data, source photos,
                        and generated images will be
                        removed.
                      </p>
                
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={
                            deletingProjectId ===
                            project.id
                          }
                          onClick={() =>
                            setConfirmDeleteProjectId(
                              null,
                            )
                          }
                        >
                          Cancel
                        </Button>
                      
                        <Button
                          type="button"
                          variant="destructive"
                          disabled={
                            deletingProjectId ===
                            project.id
                          }
                          onClick={() =>
                            void deleteProject(
                              project.id,
                            )
                          }
                        >
                          {deletingProjectId ===
                          project.id ? (
                            <>
                              <LoaderCircle className="size-4 animate-spin" />
                              Deleting…
                            </>
                          ) : (
                            <>
                              <Trash2 className="size-4" />
                              Delete
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full text-destructive hover:text-destructive"
                      onClick={() =>
                        setConfirmDeleteProjectId(
                          project.id,
                        )
                      }
                    >
                      <Trash2 className="size-4" />
                      Delete project
                    </Button>
                  )}
                </div>
              </CardContent>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}