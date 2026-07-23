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
import { calculateTagScore } from "@/lib/scoring/tagScore";

type AITagGeneratorCardProps = {
  title: string;
  description: string;
  currentTags?: string[];
  suggested?: string[];
  onSuggestionChange?: (
    suggestions: string[],
  ) => void;
};

type GenerateTagsResponse = {
  success: boolean;
  suggestedTags?: string[];
  error?: string;
};

export default function AITagGeneratorCard({
  title,
  description,
  currentTags = [],
  suggested = [],
  onSuggestionChange,
}: AITagGeneratorCardProps) {
  const [suggestedTags, setSuggestedTags] =
    useState<string[]>(() =>
      suggested
        .map((tag) => tag.trim())
        .filter(Boolean),
    );

  const [isGenerating, setIsGenerating] =
    useState(false);

  const [isCopied, setIsCopied] =
    useState(false);

  const [error, setError] = useState<string | null>(
    null,
  );

  const cleanedSuggestedTags = suggestedTags
    .map((tag) => tag.trim())
    .filter(Boolean);

  const currentScore = calculateTagScore(
    currentTags,
    title,
  ).score;

  const suggestedScore =
    cleanedSuggestedTags.length > 0
      ? calculateTagScore(
          cleanedSuggestedTags,
          title,
        ).score
      : null;

  function updateSuggestedTag(
    index: number,
    value: string,
  ) {
    const updatedTags = suggestedTags.map(
      (tag, tagIndex) =>
        tagIndex === index ? value : tag,
    );

    setSuggestedTags(updatedTags);

    const cleanedTags = updatedTags
      .map((tag) => tag.trim())
      .filter(Boolean);

    onSuggestionChange?.(cleanedTags);
    setIsCopied(false);
  }

  async function generateSuggestedTags() {
    try {
      setIsGenerating(true);
      setError(null);
      setIsCopied(false);

      const response = await fetch(
        "/api/ai/generate-tags",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            description,
            currentTags,
          }),
        },
      );

      const data =
        (await response.json()) as GenerateTagsResponse;

      if (
        !response.ok ||
        !data.success ||
        !Array.isArray(data.suggestedTags)
      ) {
        throw new Error(
          data.error ??
            "The suggested tags could not be generated.",
        );
      }

      const cleanedSuggestions =
        data.suggestedTags
          .map((tag) => tag.trim())
          .filter(Boolean);

      setSuggestedTags(cleanedSuggestions);
      onSuggestionChange?.(cleanedSuggestions);
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

  async function copyTags() {
    if (cleanedSuggestedTags.length === 0) {
      return;
    }

    try {
      setError(null);

      await navigator.clipboard.writeText(
        cleanedSuggestedTags.join(", "),
      );

      setIsCopied(true);

      window.setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch {
      setError(
        "The tags could not be copied. Please copy them manually.",
      );
    }
  }

  return (
    <div className="min-w-0 rounded-xl border bg-card p-4 shadow-sm sm:p-6">
      <div className="flex min-w-0 items-center gap-2">
        <Sparkles className="size-5 shrink-0 text-primary" />

        <h2 className="min-w-0 wrap-break-words text-base font-semibold sm:text-lg">
          AI Etsy Tag Generator
        </h2>
      </div>

      <p className="mt-2 wrap-break-words text-sm leading-6 text-muted-foreground">
        Generate and edit 13 Etsy search tags based on the
        real title, description, and current tags.
      </p>

      <div className="mt-5 min-w-0 space-y-5 sm:mt-6 sm:space-y-6">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <p className="text-sm font-medium text-muted-foreground">
              Current tags
            </p>

            <span className="shrink-0 text-xs text-muted-foreground">
              {currentTags.length}/13
            </span>
          </div>

          <div className="mt-3 flex min-h-20 min-w-0 flex-wrap content-start gap-2 rounded-lg border bg-muted/40 p-3 sm:p-4">
            {currentTags.length > 0 ? (
              currentTags.map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="max-w-full whitespace-normal wrap-break-words rounded-full border bg-background px-3 py-1 text-xs"
                >
                  {tag}
                </span>
              ))
            ) : (
              <p className="wrap-break-words text-sm text-muted-foreground">
                This listing does not currently have any
                tags.
              </p>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <p className="text-sm font-medium text-emerald-700">
              Suggested tags
            </p>

            <span className="shrink-0 text-xs text-muted-foreground">
              {cleanedSuggestedTags.length}/13
            </span>
          </div>

          <div
            className="mt-3 min-h-28 min-w-0 rounded-lg border border-emerald-200 bg-emerald-50 p-3 sm:p-4"
            aria-live="polite"
          >
            {isGenerating ? (
              <div className="flex min-w-0 items-start gap-2 text-sm text-emerald-700">
                <LoaderCircle className="mt-0.5 size-4 shrink-0 animate-spin" />

                <span className="wrap-break-words">
                  Generating optimized Etsy tags…
                </span>
              </div>
            ) : suggestedTags.length > 0 ? (
              <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {suggestedTags.map((tag, index) => (
                  <div
                    key={index}
                    className="min-w-0 rounded-lg border border-emerald-200 bg-white p-3"
                  >
                    <label
                      htmlFor={`suggested-tag-${index}`}
                      className="text-xs font-medium text-emerald-800"
                    >
                      Tag {index + 1}
                    </label>

                    <input
                      id={`suggested-tag-${index}`}
                      type="text"
                      value={tag}
                      maxLength={20}
                      onChange={(event) =>
                        updateSuggestedTag(
                          index,
                          event.target.value,
                        )
                      }
                      className="mt-2 w-full min-w-0 rounded-md border px-3 py-2 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    />

                    <p
                      className={`mt-1 text-right text-[11px] ${
                        tag.length >= 18
                          ? "font-medium text-amber-700"
                          : "text-muted-foreground"
                      }`}
                    >
                      {tag.length}/20
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="wrap-break-words text-sm text-emerald-800">
                Generate suggestions to see 13 optimized
                tags.
              </p>
            )}
          </div>

          {suggestedTags.length > 0 && (
            <p className="mt-2 wrap-break-words text-xs text-muted-foreground">
              Edit any tag before copying it. Each tag is
              limited to 20 characters.
            </p>
          )}
        </div>

        <div className="min-w-0">
          <ScoreComparison
            label="tag"
            currentScore={currentScore}
            suggestedScore={suggestedScore}
            nonImprovementMessage="These tags did not improve the rule-based tag score. Edit the tags or generate another set before using them."
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
            onClick={generateSuggestedTags}
            disabled={
              isGenerating || !title.trim()
            }
          >
            {isGenerating ? (
              <>
                <LoaderCircle className="size-4 shrink-0 animate-spin" />
                Generating
              </>
            ) : (
              <>
                <RefreshCw className="size-4 shrink-0" />

                {suggestedTags.length > 0
                  ? "Generate Again"
                  : "Generate Tags"}
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={copyTags}
            disabled={
              cleanedSuggestedTags.length === 0 ||
              isGenerating
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
                Copy All Tags
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}