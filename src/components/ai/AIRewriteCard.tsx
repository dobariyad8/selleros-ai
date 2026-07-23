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
import { calculateTitleScore } from "@/lib/scoring/titleScore";

type AIRewriteCardProps = {
  current: string;
  suggested?: string;
  onSuggestionChange?: (suggestion: string) => void;
};

type RewriteTitleResponse = {
  success: boolean;
  suggestedTitle?: string;
  error?: string;
};

export default function AIRewriteCard({
  current,
  suggested = "",
  onSuggestionChange,
}: AIRewriteCardProps) {
  const [aiSuggestion, setAiSuggestion] =
    useState(suggested);

  const [isGenerating, setIsGenerating] =
    useState(false);

  const [isCopied, setIsCopied] =
    useState(false);

  const [error, setError] = useState<string | null>(
    null,
  );

  const currentScore =
    calculateTitleScore(current).score;

  const suggestedScore = aiSuggestion
    ? calculateTitleScore(aiSuggestion).score
    : null;

  function updateSuggestion(value: string) {
    setAiSuggestion(value);
    onSuggestionChange?.(value);
  }

  async function generateRewrite() {
    try {
      setIsGenerating(true);
      setError(null);
      setIsCopied(false);

      const response = await fetch(
        "/api/ai/rewrite-title",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: current,
          }),
        },
      );

      const data =
        (await response.json()) as RewriteTitleResponse;

      if (
        !response.ok ||
        !data.success ||
        typeof data.suggestedTitle !== "string"
      ) {
        throw new Error(
          data.error ??
            "The title rewrite could not be generated.",
        );
      }

      updateSuggestion(
        data.suggestedTitle.trim(),
      );
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

  async function copyTitle() {
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
        "The title could not be copied. Please copy it manually.",
      );
    }
  }

  return (
    <div className="min-w-0 rounded-xl border bg-card p-4 shadow-sm sm:p-6">
      <div className="flex min-w-0 items-center gap-2">
        <Sparkles className="size-5 shrink-0 text-primary" />

        <h2 className="min-w-0 wrap-break-words text-base font-semibold sm:text-lg">
          AI Title Rewrite
        </h2>
      </div>

      <p className="mt-2 wrap-break-words text-sm leading-6 text-muted-foreground">
        Generate an optimized title based on the current
        Etsy listing.
      </p>

      <div className="mt-5 min-w-0 space-y-5 sm:mt-6 sm:space-y-6">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">
            Current title
          </p>

          <div className="mt-2 min-w-0 wrap-break-words rounded-lg border bg-muted/40 p-3 text-sm leading-6 sm:p-4">
            {current}
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium text-emerald-700">
            Suggested title
          </p>

          {isGenerating ? (
            <div
              className="mt-2 min-h-24 min-w-0 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-700 sm:p-4"
              aria-live="polite"
            >
              <div className="flex min-w-0 items-start gap-2">
                <LoaderCircle className="mt-0.5 size-4 shrink-0 animate-spin" />

                <span className="wrap-break-words">
                  Generating an optimized title…
                </span>
              </div>
            </div>
          ) : (
            <>
              <textarea
                value={aiSuggestion}
                onChange={(event) =>
                  updateSuggestion(
                    event.target.value,
                  )
                }
                maxLength={140}
                rows={4}
                placeholder="Generate a rewrite to see an optimized title."
                className="mt-2 w-full min-w-0 resize-y rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-950 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 sm:p-4"
              />

              <div className="mt-2 flex min-w-0 flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <span className="wrap-break-words text-muted-foreground">
                  Edit the suggestion before copying it.
                </span>

                <span
                  className={
                    aiSuggestion.length >= 130
                      ? "shrink-0 font-medium text-amber-700"
                      : "shrink-0 text-muted-foreground"
                  }
                >
                  {aiSuggestion.length}/140
                </span>
              </div>
            </>
          )}
        </div>

        <div className="min-w-0">
          <ScoreComparison
            label="title"
            currentScore={currentScore}
            suggestedScore={suggestedScore}
            nonImprovementMessage="This rewrite did not improve the rule-based title score. Generate another option before using it."
          />
        </div>

        {error && (
          <div
            role="alert"
            className="min-w-0 wrap-break-words rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={generateRewrite}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <LoaderCircle className="size-4 shrink-0 animate-spin" />
                Generating
              </>
            ) : (
              <>
                <RefreshCw className="size-4 shrink-0" />

                {aiSuggestion
                  ? "Generate Again"
                  : "Generate Rewrite"}
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={copyTitle}
            disabled={
              !aiSuggestion || isGenerating
            }
          >
            {isCopied ? (
              <>
                <Check className="size-4 shrink-0" />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-4 shrink-0" />
                Copy Title
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}