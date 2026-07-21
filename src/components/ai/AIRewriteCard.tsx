"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  LoaderCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import ScoreComparison from "@/components/ai/ScoreComparison";
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

      const cleanedSuggestion =
        data.suggestedTitle.trim();
        
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
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-primary" />

        <h2 className="text-lg font-semibold">
          AI Title Rewrite
        </h2>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">
        Generate an optimized title based on the current
        Etsy listing.
      </p>

      <div className="mt-6 space-y-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Current title
          </p>

          <div className="mt-2 rounded-lg border bg-muted/40 p-4 text-sm leading-6">
            {current}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-emerald-700">
            Suggested title
          </p>

          {isGenerating ? (
              <div
                className="mt-2 min-h-24 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-700"
                aria-live="polite"
              >
                <div className="flex items-center gap-2">
                  <LoaderCircle className="size-4 animate-spin" />
                  Generating an optimized title…
                </div>
              </div>
            ) : (
              <>
                <textarea
                  value={aiSuggestion}
                  onChange={(event) =>
                    updateSuggestion(event.target.value)
                  }
                  maxLength={140}
                  rows={4}
                  placeholder="Generate a rewrite to see an optimized title."
                  className="mt-2 w-full resize-y rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
            
                <div className="mt-2 flex items-center justify-between gap-4 text-xs">
                  <span className="text-muted-foreground">
                    Edit the suggestion before copying it.
                  </span>
              
                  <span
                    className={
                      aiSuggestion.length >= 130
                        ? "font-medium text-amber-700"
                        : "text-muted-foreground"
                    }
                  >
                    {aiSuggestion.length}/140
                  </span>
                </div>
              </>
            )}
        </div>

        <ScoreComparison
          label="title"
          currentScore={currentScore}
          suggestedScore={suggestedScore}
          nonImprovementMessage="This rewrite did not improve the rule-based title score. Generate another option before using it."
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
            disabled={isGenerating}
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
            onClick={copyTitle}
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
                Copy Title
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}