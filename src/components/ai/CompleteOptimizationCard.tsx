"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  Download,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type CompleteOptimizationCardProps = {
  currentTitle: string;
  currentDescription: string;
  currentTags: string[];
  suggestedTitle: string;
  suggestedDescription: string;
  suggestedTags: string[];
};

export default function CompleteOptimizationCard({
  currentTitle,
  suggestedTitle,
  suggestedDescription,
  suggestedTags,
}: CompleteOptimizationCardProps) {
  const [isCopied, setIsCopied] =
    useState(false);

  const [error, setError] = useState<string | null>(
    null,
  );

  const cleanedSuggestedTitle =
    suggestedTitle.trim();

  const cleanedSuggestedDescription =
    suggestedDescription.trim();

  const cleanedSuggestedTags = suggestedTags
    .map((tag) => tag.trim())
    .filter(Boolean);

  const hasTitleSuggestion =
    cleanedSuggestedTitle.length > 0;

  const hasDescriptionSuggestion =
    cleanedSuggestedDescription.length > 0;

  const hasTagSuggestions =
    cleanedSuggestedTags.length > 0;

  const hasAnySuggestion =
    hasTitleSuggestion ||
    hasDescriptionSuggestion ||
    hasTagSuggestions;

  const hasCompleteOptimization =
    hasTitleSuggestion &&
    hasDescriptionSuggestion &&
    cleanedSuggestedTags.length === 13;

  const optimizationSections: string[] = [];

  if (hasTitleSuggestion) {
    optimizationSections.push(
      [
        "OPTIMIZED TITLE",
        cleanedSuggestedTitle,
      ].join("\n"),
    );
  }

  if (hasDescriptionSuggestion) {
    optimizationSections.push(
      [
        "OPTIMIZED DESCRIPTION",
        cleanedSuggestedDescription,
      ].join("\n"),
    );
  }

  if (hasTagSuggestions) {
    optimizationSections.push(
      [
        "OPTIMIZED TAGS",
        cleanedSuggestedTags.join(", "),
      ].join("\n"),
    );
  }

  const optimizationText =
    optimizationSections.join("\n\n");

  async function copyOptimization() {
    if (!hasAnySuggestion) {
      return;
    }

    try {
      setError(null);

      await navigator.clipboard.writeText(
        optimizationText,
      );

      setIsCopied(true);

      window.setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch {
      setError(
        "The optimization could not be copied. Please copy each section manually.",
      );
    }
  }

  function downloadOptimization() {
    if (!hasAnySuggestion) {
      return;
    }

    try {
      setError(null);

      const fileTitle =
        cleanedSuggestedTitle || currentTitle;

      const safeTitle = fileTitle
        .slice(0, 50)
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();

      const fileName = `${
        safeTitle || "etsy-listing"
      }-optimization.txt`;

      const fileBlob = new Blob(
        [optimizationText],
        {
          type: "text/plain;charset=utf-8",
        },
      );

      const fileUrl =
        window.URL.createObjectURL(fileBlob);

      const downloadLink =
        document.createElement("a");

      downloadLink.href = fileUrl;
      downloadLink.download = fileName;

      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();

      window.URL.revokeObjectURL(fileUrl);
    } catch {
      setError(
        "The optimization file could not be downloaded.",
      );
    }
  }

  return (
    <div className="min-w-0 rounded-xl border bg-card p-4 shadow-sm sm:p-6">
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <Sparkles className="size-5 shrink-0 text-primary" />

            <h2 className="min-w-0 wrap-break-words text-base font-semibold sm:text-lg">
              Complete Listing Optimization
            </h2>
          </div>

          <p className="mt-2 max-w-2xl wrap-break-words text-sm leading-6 text-muted-foreground">
            Review and export the AI-generated listing
            improvements that are currently ready.
          </p>
        </div>

        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={copyOptimization}
            disabled={!hasAnySuggestion}
          >
            {isCopied ? (
              <>
                <Check className="size-4 shrink-0" />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-4 shrink-0" />

                {hasCompleteOptimization
                  ? "Copy Complete Optimization"
                  : "Copy Available Suggestions"}
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={downloadOptimization}
            disabled={!hasAnySuggestion}
          >
            <Download className="size-4 shrink-0" />

            {hasCompleteOptimization
              ? "Download Complete Optimization"
              : "Download Available Suggestions"}
          </Button>
        </div>
      </div>

      <div className="mt-5 grid min-w-0 grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-3 sm:gap-4">
        <div className="min-w-0 rounded-lg border bg-muted/30 p-3 sm:p-4">
          <p className="text-sm font-medium">
            Title
          </p>

          <p
            className={`mt-2 wrap-break-words text-xs ${
              hasTitleSuggestion
                ? "text-emerald-700"
                : "text-muted-foreground"
            }`}
          >
            {hasTitleSuggestion
              ? "AI suggestion ready"
              : "Not generated yet"}
          </p>
        </div>

        <div className="min-w-0 rounded-lg border bg-muted/30 p-3 sm:p-4">
          <p className="text-sm font-medium">
            Description
          </p>

          <p
            className={`mt-2 wrap-break-words text-xs ${
              hasDescriptionSuggestion
                ? "text-emerald-700"
                : "text-muted-foreground"
            }`}
          >
            {hasDescriptionSuggestion
              ? "AI suggestion ready"
              : "Not generated yet"}
          </p>
        </div>

        <div className="min-w-0 rounded-lg border bg-muted/30 p-3 sm:p-4">
          <p className="text-sm font-medium">
            Tags
          </p>

          <p
            className={`mt-2 wrap-break-words text-xs ${
              hasTagSuggestions
                ? "text-emerald-700"
                : "text-muted-foreground"
            }`}
          >
            {hasTagSuggestions
              ? `${cleanedSuggestedTags.length} AI ${
                  cleanedSuggestedTags.length === 1
                    ? "tag"
                    : "tags"
                } ready`
              : "Not generated yet"}
          </p>
        </div>
      </div>

      {!hasAnySuggestion && (
        <p className="mt-4 wrap-break-words text-sm text-amber-700">
          Generate at least one AI suggestion before
          copying or downloading.
        </p>
      )}

      {hasAnySuggestion &&
        !hasCompleteOptimization && (
          <div className="mt-4 min-w-0 wrap-break-words rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
            Only AI-generated sections will be included.
            Current listing content will not be labeled or
            exported as optimized.
          </div>
        )}

      {hasCompleteOptimization && (
        <div className="mt-4 min-w-0 wrap-break-words rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-800">
          The optimized title, description, and all 13
          tags are ready.
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-4 min-w-0 wrap-break-words rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}
    </div>
  );
}