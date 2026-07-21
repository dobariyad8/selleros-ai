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
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-primary" />

        <h2 className="text-lg font-semibold">
          AI Etsy Tag Generator
        </h2>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">
        Generate and edit 13 Etsy search tags based on
        the real title, description, and current tags.
      </p>

      <div className="mt-6 space-y-6">
        <div>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-muted-foreground">
              Current tags
            </p>

            <span className="text-xs text-muted-foreground">
              {currentTags.length}/13
            </span>
          </div>

          <div className="mt-3 flex min-h-20 flex-wrap content-start gap-2 rounded-lg border bg-muted/40 p-4">
            {currentTags.length > 0 ? (
              currentTags.map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="rounded-full border bg-background px-3 py-1 text-xs"
                >
                  {tag}
                </span>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                This listing does not currently have any
                tags.
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-emerald-700">
              Suggested tags
            </p>

            <span className="text-xs text-muted-foreground">
              {cleanedSuggestedTags.length}/13
            </span>
          </div>

          <div
            className="mt-3 min-h-28 rounded-lg border border-emerald-200 bg-emerald-50 p-4"
            aria-live="polite"
          >
            {isGenerating ? (
              <div className="flex items-center gap-2 text-sm text-emerald-700">
                <LoaderCircle className="size-4 animate-spin" />

                Generating optimized Etsy tags…
              </div>
            ) : suggestedTags.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {suggestedTags.map((tag, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-emerald-200 bg-white p-3"
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
                      className="mt-2 w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
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
              <p className="text-sm text-emerald-800">
                Generate suggestions to see 13 optimized
                tags.
              </p>
            )}
          </div>

          {suggestedTags.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Edit any tag before copying it. Each tag is
              limited to 20 characters.
            </p>
          )}
        </div>

        <ScoreComparison
          label="tag"
          currentScore={currentScore}
          suggestedScore={suggestedScore}
          nonImprovementMessage="These tags did not improve the rule-based tag score. Edit the tags or generate another set before using them."
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
            onClick={generateSuggestedTags}
            disabled={
              isGenerating || !title.trim()
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

                {suggestedTags.length > 0
                  ? "Generate Again"
                  : "Generate Tags"}
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={copyTags}
            disabled={
              cleanedSuggestedTags.length === 0 ||
              isGenerating
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
                Copy All Tags
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}