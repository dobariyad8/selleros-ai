"use client";

import { useState } from "react";
import {
  Check,
  Copy,
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
  currentDescription,
  currentTags,
  suggestedTitle,
  suggestedDescription,
  suggestedTags,
}: CompleteOptimizationCardProps) {
  const [isCopied, setIsCopied] =
    useState(false);

  const [error, setError] = useState<string | null>(
    null,
  );

  const finalTitle =
    suggestedTitle.trim() || currentTitle.trim();

  const finalDescription =
    suggestedDescription.trim() ||
    currentDescription.trim();

  const finalTags =
    suggestedTags.length > 0
      ? suggestedTags
      : currentTags;

  const hasAnySuggestion =
    suggestedTitle.trim().length > 0 ||
    suggestedDescription.trim().length > 0 ||
    suggestedTags.length > 0;

  const optimizationText = [
    "OPTIMIZED TITLE",
    finalTitle || "No title available.",
    "",
    "OPTIMIZED DESCRIPTION",
    finalDescription || "No description available.",
    "",
    "OPTIMIZED TAGS",
    finalTags.length > 0
      ? finalTags.join(", ")
      : "No tags available.",
  ].join("\n");

  async function copyCompleteOptimization() {
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
        "The complete optimization could not be copied. Please copy each section manually.",
      );
    }
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />

            <h2 className="text-lg font-semibold">
              Complete Listing Optimization
            </h2>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            Copy the optimized title, description, and
            tags together after generating your AI
            suggestions.
          </p>
        </div>

        <Button
          type="button"
          onClick={copyCompleteOptimization}
          disabled={!hasAnySuggestion}
        >
          {isCopied ? (
            <>
              <Check />
              Copied Everything
            </>
          ) : (
            <>
              <Copy />
              Copy Complete Optimization
            </>
          )}
        </Button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-sm font-medium">
            Title
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            {suggestedTitle
              ? "AI suggestion ready"
              : "Using current title"}
          </p>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-sm font-medium">
            Description
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            {suggestedDescription
              ? "AI suggestion ready"
              : "Using current description"}
          </p>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-sm font-medium">
            Tags
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            {suggestedTags.length > 0
              ? `${suggestedTags.length} AI tags ready`
              : `Using ${currentTags.length} current tags`}
          </p>
        </div>
      </div>

      {!hasAnySuggestion && (
        <p className="mt-4 text-sm text-amber-700">
          Generate at least one AI suggestion before
          copying the complete optimization.
        </p>
      )}

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}
    </div>
  );
}