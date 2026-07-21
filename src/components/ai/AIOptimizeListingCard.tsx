"use client";

import { useState } from "react";
import {
  CheckCircle2,
  LoaderCircle,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type OptimizedListing = {
  title: string;
  description: string;
  tags: string[];
};

type OptimizeListingResponse = {
  success: boolean;
  optimizedListing?: OptimizedListing;
  error?: string;
};

type AIOptimizeListingCardProps = {
  currentTitle: string;
  currentDescription: string;
  currentTags: string[];
  onOptimizationComplete?: (
    optimizedListing: OptimizedListing,
  ) => void;
};

export default function AIOptimizeListingCard({
  currentTitle,
  currentDescription,
  currentTags,
  onOptimizationComplete,
}: AIOptimizeListingCardProps) {
  const [isOptimizing, setIsOptimizing] =
    useState(false);

  const [isComplete, setIsComplete] =
    useState(false);

  const [error, setError] = useState<string | null>(
    null,
  );

  async function optimizeEntireListing() {
    try {
      setIsOptimizing(true);
      setIsComplete(false);
      setError(null);

      const response = await fetch(
        "/api/ai/optimize-listing",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: currentTitle,
            description: currentDescription,
            tags: currentTags,
          }),
        },
      );

      const data =
        (await response.json()) as OptimizeListingResponse;

      const optimizedListing =
        data.optimizedListing;

      if (
        !response.ok ||
        !data.success ||
        !optimizedListing ||
        typeof optimizedListing.title !== "string" ||
        typeof optimizedListing.description !==
          "string" ||
        !Array.isArray(optimizedListing.tags)
      ) {
        throw new Error(
          data.error ??
            "The complete listing optimization could not be generated.",
        );
      }

      const cleanedResult: OptimizedListing = {
        title: optimizedListing.title.trim(),
        description:
          optimizedListing.description.trim(),
        tags: optimizedListing.tags
          .filter(
            (tag): tag is string =>
              typeof tag === "string",
          )
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      onOptimizationComplete?.(cleanedResult);
      setIsComplete(true);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "An unexpected error occurred.";

      setError(message);
    } finally {
      setIsOptimizing(false);
    }
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />

            <h2 className="text-lg font-semibold">
              Optimize Entire Listing
            </h2>
          </div>

          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Generate an improved title, description, and
            13 Etsy-valid tags in one complete optimization.
          </p>
        </div>

        <Button
          type="button"
          onClick={optimizeEntireListing}
          disabled={
            isOptimizing ||
            !currentTitle.trim()
          }
        >
          {isOptimizing ? (
            <>
              <LoaderCircle className="animate-spin" />
              Optimizing Listing
            </>
          ) : (
            <>
              <Sparkles />
              {isComplete
                ? "Optimize Again"
                : "Optimize Entire Listing"}
            </>
          )}
        </Button>
      </div>

      {isOptimizing && (
        <div
          className="mt-5 rounded-lg border bg-background/70 p-4"
          aria-live="polite"
        >
          <div className="flex items-center gap-3">
            <LoaderCircle className="size-5 animate-spin text-primary" />

            <div>
              <p className="text-sm font-medium">
                Creating your complete optimization…
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                SellerOS is rewriting the title and
                description, generating tags, and validating
                the results. This may take a little longer
                than an individual rewrite.
              </p>
            </div>
          </div>
        </div>
      )}

      {isComplete && !isOptimizing && (
        <div
          className="mt-5 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800"
          role="status"
        >
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" />

          <div>
            <p className="text-sm font-medium">
              Complete optimization generated
            </p>

            <p className="mt-1 text-xs">
              The optimized title, description, and tags
              are ready for review and copying.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}
    </div>
  );
}