"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  LoaderCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import ScoreComparison from "@/components/ai/ScoreComparison";
import { Button } from "@/components/ui/button";
import { calculateDescriptionScore } from "@/lib/scoring/descriptionScore";

type AIDescriptionRewriteCardProps = {
  title: string;
  current: string;
  suggested?: string;
  onSuggestionChange?: (suggestion: string) => void;
};

type RewriteDescriptionResponse = {
  success: boolean;
  suggestedDescription?: string;
  error?: string;
};

export default function AIDescriptionRewriteCard({
  title,
  current,
  suggested = "",
  onSuggestionChange,
}: AIDescriptionRewriteCardProps) {
  const [aiSuggestion, setAiSuggestion] =
    useState(suggested);

  const [isGenerating, setIsGenerating] =
    useState(false);

  const [isCopied, setIsCopied] =
    useState(false);

  const [error, setError] = useState<string | null>(
    null,
  );

  const hasCurrentDescription =
    current.trim().length > 0;

  const currentScore = calculateDescriptionScore(
    current,
    title,
  ).score;

  const suggestedScore = aiSuggestion
    ? calculateDescriptionScore(
        aiSuggestion,
        title,
      ).score
    : null;
  
  function updateSuggestion(value: string) {
  setAiSuggestion(value);
  onSuggestionChange?.(value);
}

  async function generateRewrite() {
    if (!hasCurrentDescription) {
      setError(
        "This listing needs a current description before it can be rewritten.",
      );

      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setIsCopied(false);

      const response = await fetch(
        "/api/ai/rewrite-description",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            description: current,
          }),
        },
      );

      const data =
        (await response.json()) as RewriteDescriptionResponse;

      if (
        !response.ok ||
        !data.success ||
        typeof data.suggestedDescription !==
          "string"
      ) {
        throw new Error(
          data.error ??
            "The description rewrite could not be generated.",
        );
      }

      const cleanedSuggestion =
      data.suggestedDescription.trim();

      updateSuggestion(cleanedSuggestion);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "An unexpected error occurred.";

      setError(message);
    } finally {
      setIsGenerating(false);
    }
  }

  async function copyDescription() {
    if (!aiSuggestion) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        aiSuggestion,
      );

      setIsCopied(true);

      window.setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch {
      setError(
        "The description could not be copied. Please copy it manually.",
      );
    }
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-primary" />

        <h2 className="text-lg font-semibold">
          AI Description Rewrite
        </h2>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">
        Improve readability, product clarity, and buyer
        confidence while preserving the listing details.
      </p>

      <div className="mt-6 space-y-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Current description
          </p>

          <div className="mt-2 max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg border bg-muted/40 p-4 text-sm leading-6">
            {hasCurrentDescription
              ? current
              : "This listing does not currently have a description."}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-emerald-700">
            Suggested description
          </p>

          {isGenerating ? (
            <div
              className="mt-2 min-h-40 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-700"
              aria-live="polite"
            >
              <div className="flex items-center gap-2">
                <LoaderCircle className="size-4 animate-spin" />
                Generating an optimized description…
              </div>
            </div>
          ) : (
            <>
              <textarea
                value={aiSuggestion}
                onChange={(event) =>
                  updateSuggestion(event.target.value)
                }
                rows={14}
                placeholder="Generate a rewrite to see an optimized description."
                className="mt-2 w-full resize-y rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
          
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>
                  Edit the description before copying it.
                </span>
              
                <span>
                  {aiSuggestion.length.toLocaleString()} characters
                </span>
              </div>
            </>
          )}
        </div>

        <ScoreComparison
          label="description"
          currentScore={currentScore}
          suggestedScore={suggestedScore}
          nonImprovementMessage="This rewrite did not improve the rule-based description score. Generate another version before using it."
        />

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={generateRewrite}
            disabled={
              isGenerating ||
              !hasCurrentDescription
            }
          >
            {isGenerating ? (
              <>
                <LoaderCircle className="animate-spin" />
                Generating
              </>
            ) : (
              <>
                <RefreshCw />

                {aiSuggestion
                  ? "Generate Again"
                  : "Generate Rewrite"}
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={copyDescription}
            disabled={
              !aiSuggestion || isGenerating
            }
          >
            {isCopied ? (
              <>
                <Check />
                Copied
              </>
            ) : (
              <>
                <Copy />
                Copy Description
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}