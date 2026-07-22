"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { useListings } from "@/hooks/useListings";

import AuditScoreCard from "@/components/ai/AuditScoreCard";
import OpportunityCard from "@/components/ai/OpportunityCard";
import AnalysisSection from "@/components/ai/AnalysisSection";
import AIRewriteCard from "@/components/ai/AIRewriteCard";
import AIDescriptionRewriteCard from "@/components/ai/AIDescriptionReWriteCard";
import AITagGeneratorCard from "@/components/ai/AITagGeneratorCard";
import AIOptimizeListingCard from "@/components/ai/AIOptimizeListingCard";
import CompleteOptimizationCard from "@/components/ai/CompleteOptimizationCard";
import OptimizationImpactCard from "@/components/ai/OptimizationImpactCard";
import { Skeleton } from "@/components/ui/skeleton";

import { calculateTitleScore } from "@/lib/scoring/titleScore";
import { calculateTagScore } from "@/lib/scoring/tagScore";
import { calculateDescriptionScore } from "@/lib/scoring/descriptionScore";
import { calculateImageScore } from "@/lib/scoring/imageScore";
import { calculatePricingScore } from "@/lib/scoring/pricingScore";
import { calculateOverallScore } from "@/lib/scoring/overallScore";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  clearOptimizationDraft,
  loadOptimizationDraft,
  saveOptimizationDraft,
} from "@/lib/storage/optimizationDraft";


type OptimizedListing = {
  title: string;
  description: string;
  tags: string[];
};

export default function AuditPage() {
  const params = useParams<{
    listingId: string;
  }>();

  const {
    listings,
    isLoading,
    error,
  } = useListings();

  const [suggestedTitle, setSuggestedTitle] =
    useState("");

  const [
    suggestedDescription,
    setSuggestedDescription,
  ] = useState("");

  const [suggestedTags, setSuggestedTags] =
    useState<string[]>([]);

  const [
    optimizationVersion,
    setOptimizationVersion,
  ] = useState(0);

  const [
    loadedDraftListingId,
    setLoadedDraftListingId,
  ] = useState<string | null>(null);

  const [draftSavedAt, setDraftSavedAt] =
  useState<string | null>(null);

  const listingId = String(params.listingId);

  /*
   * Restore the saved optimization draft whenever the
   * listing ID in the URL changes.
   */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const storedDraft =
      loadOptimizationDraft(listingId);

    setSuggestedTitle(
      storedDraft?.suggestedTitle ?? "",
    );

    setSuggestedDescription(
      storedDraft?.suggestedDescription ?? "",
    );

    setSuggestedTags(
      storedDraft?.suggestedTags ?? [],
    );

    setDraftSavedAt(
      storedDraft?.updatedAt ?? null,
    );

    /*
     * The AI editor components keep their own internal state.
     * Changing this version remounts them with the restored
     * draft values.
     */
    setOptimizationVersion(
      (currentVersion) => currentVersion + 1,
    );

    setLoadedDraftListingId(listingId);
  }, [listingId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /*
   * Save edits after a short delay so localStorage is not
   * updated on every immediate keystroke.
   */
  useEffect(() => {
    if (loadedDraftListingId !== listingId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const savedDraft =
      saveOptimizationDraft(listingId, {
        suggestedTitle,
        suggestedDescription,
        suggestedTags,
      });

    setDraftSavedAt(
      savedDraft?.updatedAt ?? null,
    );
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    listingId,
    loadedDraftListingId,
    suggestedTitle,
    suggestedDescription,
    suggestedTags,
  ]);

  function handleOptimizationComplete(
    optimizedListing: OptimizedListing,
  ) {
    setSuggestedTitle(optimizedListing.title);

    setSuggestedDescription(
      optimizedListing.description,
    );

    setSuggestedTags(optimizedListing.tags);

    /*
     * Remount all three editors so the complete optimization
     * appears inside their editable fields.
     */
    setOptimizationVersion(
      (currentVersion) => currentVersion + 1,
    );
  }

  function handleDiscardDraft() {
  clearOptimizationDraft(listingId);

  setSuggestedTitle("");
  setSuggestedDescription("");
  setSuggestedTags([]);
  setDraftSavedAt(null);

  setOptimizationVersion(
    (currentVersion) => currentVersion + 1,
  );
}

  const listing = listings.find(
    (item) =>
      String(item.id) === listingId,
  );

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />

          <Skeleton className="h-9 w-full max-w-3xl" />

          <Skeleton className="h-4 w-48" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map(
            (_, index) => (
              <Skeleton
                key={index}
                className="h-36 rounded-xl"
              />
            ),
          )}
        </div>

        <Skeleton className="h-48 rounded-xl" />

        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-xl font-semibold text-red-700">
          Could not load listing
        </h1>

        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <h1 className="text-xl font-semibold">
          Listing not found
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          We could not find a listing matching ID{" "}
          {listingId}.
        </p>
      </div>
    );
  }

  const titleResult =
    calculateTitleScore(listing.title);

  const tagResult = calculateTagScore(
    listing.tags ?? [],
    listing.title,
  );

  const descriptionResult =
    calculateDescriptionScore(
      listing.description ?? "",
      listing.title,
    );

  const imageResult = calculateImageScore(
    listing.imageUrls ?? [],
  );

  const pricingResult = calculatePricingScore(
    Number(listing.price ?? 0),
  );

  const overallResult = calculateOverallScore({
    title: titleResult.score,
    tags: tagResult.score,
    description: descriptionResult.score,
    images: imageResult.score,
    pricing: pricingResult.score,
  });

  const hasAISuggestions =
    suggestedTitle.trim().length > 0 ||
    suggestedDescription.trim().length > 0 ||
    suggestedTags.length > 0;

  const projectedTitle =
    suggestedTitle.trim() || listing.title;

  const projectedDescription =
    suggestedDescription.trim() ||
    (listing.description ?? "");

  const projectedTags =
    suggestedTags.length > 0
      ? suggestedTags
      : (listing.tags ?? []);

  const projectedTitleResult =
    calculateTitleScore(projectedTitle);

  const projectedTagResult =
    calculateTagScore(
      projectedTags,
      projectedTitle,
    );

  const projectedDescriptionResult =
    calculateDescriptionScore(
      projectedDescription,
      projectedTitle,
    );

  const projectedOverallResult =
    calculateOverallScore({
      title: projectedTitleResult.score,
      tags: projectedTagResult.score,
      description:
        projectedDescriptionResult.score,
      images: imageResult.score,
      pricing: pricingResult.score,
    });

  const topRecommendation =
    overallResult.recommendations[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              AI Listing Auditor
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              {listing.title}
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Listing ID: {listing.id}
            </p>

            {hasAISuggestions && draftSavedAt && (
              <p className="mt-2 text-xs text-emerald-700">
                Draft saved locally at{" "}
                {new Date(draftSavedAt).toLocaleTimeString(
                  [],
                  {
                    hour: "numeric",
                    minute: "2-digit",
                  },
                )}
              </p>
            )}

          </div>

          {hasAISuggestions && (
            <Button
              type="button"
              variant="outline"
              onClick={handleDiscardDraft}
              className="shrink-0"
            >
              <Trash2 />
              Discard Saved Draft
            </Button>
          )}
        </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AuditScoreCard
          title="Overall"
          score={overallResult.score}
        />

        <AuditScoreCard
          title="Title"
          score={titleResult.score}
        />

        <AuditScoreCard
          title="Tags"
          score={tagResult.score}
        />

        <AuditScoreCard
          title="Description"
          score={descriptionResult.score}
        />

        <AuditScoreCard
          title="Images"
          score={imageResult.score}
        />

        <AuditScoreCard
          title="Pricing"
          score={pricingResult.score}
        />
      </div>

      <OpportunityCard
        title={
          topRecommendation?.title ??
          "Maintain listing quality"
        }
        impact={`${
          topRecommendation?.impact === "high"
            ? "High"
            : topRecommendation?.impact ===
                "medium"
              ? "Medium"
              : "Low"
        } Impact`}
        effort="5–15 minutes"
        recommendation={
          topRecommendation?.description ??
          "Continue monitoring and testing this listing."
        }
      />

      <AIOptimizeListingCard
        currentTitle={listing.title}
        currentDescription={
          listing.description ?? ""
        }
        currentTags={listing.tags ?? []}
        onOptimizationComplete={
          handleOptimizationComplete
        }
      />

      <AIRewriteCard
        key={`title-${optimizationVersion}`}
        current={listing.title}
        suggested={suggestedTitle}
        onSuggestionChange={setSuggestedTitle}
      />

      <AIDescriptionRewriteCard
        key={`description-${optimizationVersion}`}
        title={listing.title}
        current={listing.description ?? ""}
        suggested={suggestedDescription}
        onSuggestionChange={
          setSuggestedDescription
        }
      />

      <AITagGeneratorCard
        key={`tags-${optimizationVersion}`}
        title={listing.title}
        description={listing.description ?? ""}
        currentTags={listing.tags ?? []}
        suggested={suggestedTags}
        onSuggestionChange={setSuggestedTags}
      />

      <CompleteOptimizationCard
        currentTitle={listing.title}
        currentDescription={
          listing.description ?? ""
        }
        currentTags={listing.tags ?? []}
        suggestedTitle={suggestedTitle}
        suggestedDescription={
          suggestedDescription
        }
        suggestedTags={suggestedTags}
      />

      <OptimizationImpactCard
        isVisible={hasAISuggestions}
        currentScores={{
          overall: overallResult.score,
          title: titleResult.score,
          tags: tagResult.score,
          description: descriptionResult.score,
        }}
        projectedScores={{
          overall: projectedOverallResult.score,
          title: projectedTitleResult.score,
          tags: projectedTagResult.score,
          description:
            projectedDescriptionResult.score,
        }}
      />

      <AnalysisSection
        title="Overall Listing Analysis"
        result={overallResult}
      />

      <AnalysisSection
        title="Title Analysis"
        result={titleResult}
      />

      <AnalysisSection
        title="Tags Analysis"
        result={tagResult}
      />

      <AnalysisSection
        title="Description Analysis"
        result={descriptionResult}
      />

      <AnalysisSection
        title="Images Analysis"
        result={imageResult}
      />

      <AnalysisSection
        title="Pricing Analysis"
        result={pricingResult}
      />
    </div>
  );
}