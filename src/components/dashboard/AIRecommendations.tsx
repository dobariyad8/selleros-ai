"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeDollarSign,
  FileText,
  ImageIcon,
  Search,
  Sparkles,
  Tags,
  type LucideIcon,
} from "lucide-react";

import AIFixWorkspace, {
  type RecommendationType,
  type WorkspaceRecommendation,
} from "./AIFixWorkspace";

import { useListings } from "@/hooks/useListings";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { calculateDescriptionScore } from "@/lib/scoring/descriptionScore";
import { calculateImageScore } from "@/lib/scoring/imageScore";
import { calculateOverallScore } from "@/lib/scoring/overallScore";
import { calculatePricingScore } from "@/lib/scoring/pricingScore";
import { calculateTagScore } from "@/lib/scoring/tagScore";
import { calculateTitleScore } from "@/lib/scoring/titleScore";

type RecommendationPriority =
  | "High"
  | "Medium"
  | "Low";

type ListingRecommendation =
  WorkspaceRecommendation & {
    categoryScore: number;
    listingScore: number;
  };

/*
 * Temporarily retained so the dashboard page continues
 * compiling. Sample recommendations are now ignored.
 */
type AIRecommendationsProps = {
  recommendations?: unknown[];
};

function getPriorityVariant(
  priority: RecommendationPriority,
) {
  if (priority === "High") {
    return "destructive" as const;
  }

  if (priority === "Medium") {
    return "secondary" as const;
  }

  return "outline" as const;
}

function getRecommendationPriority(
  categoryScore: number,
): RecommendationPriority {
  if (categoryScore < 50) {
    return "High";
  }

  if (categoryScore < 70) {
    return "Medium";
  }

  return "Low";
}

function getRecommendationIcon(
  type: RecommendationType,
): LucideIcon {
  if (type === "Image") {
    return ImageIcon;
  }

  if (type === "SEO") {
    return Search;
  }

  if (type === "Tags") {
    return Tags;
  }

  if (type === "Description") {
    return FileText;
  }

  if (type === "Pricing") {
    return BadgeDollarSign;
  }

  return Sparkles;
}

function getRecommendationContent(
  type: RecommendationType,
  score: number,
) {
  if (type === "SEO") {
    return {
      title: "Improve the listing title",
      reason: `The title currently scores ${score}/100, making it the weakest part of this listing.`,
      action:
        "Review the title length, keyword placement, readability, and repeated phrases in the AI audit.",
    };
  }

  if (type === "Tags") {
    return {
      title: "Strengthen the listing tags",
      reason: `The tags currently score ${score}/100, which may limit the listing's keyword coverage.`,
      action:
        "Review tag count, specificity, duplicate wording, and alignment with the listing title.",
    };
  }

  if (type === "Description") {
    return {
      title: "Improve the product description",
      reason: `The description currently scores ${score}/100 and may not provide enough structured buyer information.`,
      action:
        "Add clear product details, materials, dimensions, usage information, shipping expectations, and readable sections.",
    };
  }

  if (type === "Image") {
    return {
      title: "Improve the listing images",
      reason: `The image section currently scores ${score}/100 and is the weakest area of this listing.`,
      action:
        "Add more unique product images showing important angles, scale, details, packaging, and product use.",
    };
  }

  return {
    title: "Review the listing price",
    reason: `The pricing section currently scores ${score}/100 and may need further review.`,
    action:
      "Compare the price with similar products while considering materials, labor, shipping, fees, and positioning.",
  };
}

export default function AIRecommendations({
  recommendations: legacyRecommendations,
}: AIRecommendationsProps) {
  void legacyRecommendations;

  const {
    listings,
    isLoading,
    error,
  } = useListings();

  const [
    selectedRecommendation,
    setSelectedRecommendation,
  ] =
    useState<WorkspaceRecommendation | null>(
      null,
    );

  const [workspaceOpen, setWorkspaceOpen] =
    useState(false);

  const recommendationData = useMemo(() => {
    const generatedRecommendations =
      listings
        .map((listing) => {
          const titleResult =
            calculateTitleScore(listing.title);

          const tagResult =
            calculateTagScore(
              listing.tags ?? [],
              listing.title,
            );

          const descriptionResult =
            calculateDescriptionScore(
              listing.description ?? "",
              listing.title,
            );

          const imageResult =
            calculateImageScore(
              listing.imageUrls ?? [],
            );

          const pricingResult =
            calculatePricingScore(
              Number(listing.price ?? 0),
            );

          const overallResult =
            calculateOverallScore({
              title: titleResult.score,
              tags: tagResult.score,
              description:
                descriptionResult.score,
              images: imageResult.score,
              pricing: pricingResult.score,
            });

          const categoryScores = [
            {
              type: "SEO" as const,
              score: titleResult.score,
            },
            {
              type: "Tags" as const,
              score: tagResult.score,
            },
            {
              type: "Description" as const,
              score: descriptionResult.score,
            },
            {
              type: "Image" as const,
              score: imageResult.score,
            },
            {
              type: "Pricing" as const,
              score: pricingResult.score,
            },
          ];

          const weakestCategory = [
            ...categoryScores,
          ].sort(
            (first, second) =>
              first.score - second.score,
          )[0];

          const content =
            getRecommendationContent(
              weakestCategory.type,
              weakestCategory.score,
            );

          const recommendation: ListingRecommendation =
            {
              id: `${listing.id}-${weakestCategory.type.toLowerCase()}`,
              listingId: String(listing.id),
              listingTitle:
                listing.title?.trim() ||
                "Untitled listing",
              listingScore:
                overallResult.score,
              categoryScore:
                weakestCategory.score,
              type: weakestCategory.type,
              title: content.title,
              reason: content.reason,
              action: content.action,
              priority:
                getRecommendationPriority(
                  weakestCategory.score,
                ),
            };

          return recommendation;
        })
        .filter(
          (recommendation) =>
            recommendation.categoryScore < 80,
        )
        .sort((first, second) => {
          if (
            first.categoryScore !==
            second.categoryScore
          ) {
            return (
              first.categoryScore -
              second.categoryScore
            );
          }

          return (
            first.listingScore -
            second.listingScore
          );
        });

    return {
      all: generatedRecommendations,
      displayed:
        generatedRecommendations.slice(0, 3),
    };
  }, [listings]);

  function openWorkspace(
    recommendation: WorkspaceRecommendation,
  ) {
    setSelectedRecommendation(
      recommendation,
    );

    setWorkspaceOpen(true);
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 lg:grid-cols-3">
            {Array.from({ length: 3 }).map(
              (_, index) => (
                <Skeleton
                  key={index}
                  className="h-72 rounded-xl"
                />
              ),
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Sparkles className="size-5" />
            AI Recommendations
          </CardTitle>

          <CardDescription>
            Recommendations could not be calculated.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-5" />
                AI Recommendations
              </CardTitle>

              <CardDescription className="mt-1">
                Recommended actions based on your
                connected listing scores.
              </CardDescription>
            </div>

            <Badge variant="outline">
              {recommendationData.all.length}{" "}
              {recommendationData.all.length === 1
                ? "recommendation"
                : "recommendations"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {recommendationData.displayed.length >
          0 ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {recommendationData.displayed.map(
                (recommendation) => {
                  const RecommendationIcon =
                    getRecommendationIcon(
                      recommendation.type,
                    );

                  return (
                    <div
                      key={recommendation.id}
                      className="group flex h-full flex-col rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:bg-muted/30 hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <RecommendationIcon className="size-5" />
                        </div>

                        <Badge
                          variant={getPriorityVariant(
                            recommendation.priority,
                          )}
                        >
                          {recommendation.priority}
                        </Badge>
                      </div>

                      <div className="mt-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">
                            {recommendation.type}
                          </Badge>

                          <span className="text-xs text-muted-foreground">
                            {
                              recommendation.categoryScore
                            }
                            /100
                          </span>
                        </div>

                        <h3 className="mt-3 font-semibold">
                          {recommendation.title}
                        </h3>

                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {
                            recommendation.listingTitle
                          }
                        </p>
                      </div>

                      <div className="mt-4 space-y-3 text-sm">
                        <div>
                          <p className="font-medium">
                            Why it matters
                          </p>

                          <p className="mt-1 line-clamp-3 text-muted-foreground">
                            {recommendation.reason}
                          </p>
                        </div>

                        <div>
                          <p className="font-medium">
                            Recommended action
                          </p>

                          <p className="mt-1 line-clamp-3 text-muted-foreground">
                            {recommendation.action}
                          </p>
                        </div>
                      </div>

                      <Button
                        className="mt-auto pt-4"
                        size="sm"
                        onClick={() =>
                          openWorkspace(
                            recommendation,
                          )
                        }
                      >
                        <Sparkles className="size-4" />
                        Review Recommendation
                      </Button>
                    </div>
                  );
                },
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <Sparkles className="mx-auto size-9 text-emerald-600" />

              <p className="mt-3 font-medium">
                No urgent recommendations
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Every connected listing currently
                has category scores of 80 or higher.
              </p>
            </div>
          )}

          {recommendationData.all.length > 3 && (
            <Button
              variant="outline"
              className="mt-4 w-full"
              nativeButton={false}
              render={<Link href="/listings" />}
            >
              View all listings
              <ArrowRight className="size-4" />
            </Button>
          )}

          <p className="mt-4 text-xs text-muted-foreground">
            Recommendations are SellerOS estimates
            based on listing content and do not
            guarantee Etsy rankings, traffic, or
            sales.
          </p>
        </CardContent>
      </Card>

      <AIFixWorkspace
        recommendation={selectedRecommendation}
        open={workspaceOpen}
        onOpenChange={setWorkspaceOpen}
      />
    </>
  );
}