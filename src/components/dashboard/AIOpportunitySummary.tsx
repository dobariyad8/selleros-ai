"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  HeartPulse,
  ListChecks,
  Sparkles,
} from "lucide-react";

import { useListings } from "@/hooks/useListings";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { calculateDescriptionScore } from "@/lib/scoring/descriptionScore";
import { calculateImageScore } from "@/lib/scoring/imageScore";
import { calculateOverallScore } from "@/lib/scoring/overallScore";
import { calculatePricingScore } from "@/lib/scoring/pricingScore";
import { calculateTagScore } from "@/lib/scoring/tagScore";
import { calculateTitleScore } from "@/lib/scoring/titleScore";

/*
 * These optional legacy props are temporarily retained
 * so the current dashboard page continues compiling.
 * The component now calculates its values from listings.
 */
type AIOpportunitySummaryProps = {
  sellerName?: string;
  highPriorityCount?: number;
  potentialRevenue?: number;
  confidence?: number;
};

export default function AIOpportunitySummary(
  legacyProps: AIOpportunitySummaryProps,
) {
  void legacyProps;

  const {
    listings,
    isLoading,
    error,
  } = useListings();

  const opportunityData = useMemo(() => {
    const analyzedListings = listings.map(
      (listing) => {
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

        const imageResult =
          calculateImageScore(
            listing.imageUrls ?? [],
          );

        const pricingResult =
          calculatePricingScore(
            Number(listing.price ?? 0),
          );

        const categoryScores = [
          titleResult.score,
          tagResult.score,
          descriptionResult.score,
          imageResult.score,
          pricingResult.score,
        ];

        const overallResult =
          calculateOverallScore({
            title: titleResult.score,
            tags: tagResult.score,
            description:
              descriptionResult.score,
            images: imageResult.score,
            pricing: pricingResult.score,
          });

        return {
          id: String(listing.id),
          title:
            listing.title?.trim() ||
            "Untitled listing",
          overallScore: overallResult.score,
          opportunityCount:
            categoryScores.filter(
              (score) => score < 70,
            ).length,
        };
      },
    );

    const totalScore = analyzedListings.reduce(
      (sum, listing) =>
        sum + listing.overallScore,
      0,
    );

    const averageHealth =
      analyzedListings.length > 0
        ? Math.round(
            totalScore /
              analyzedListings.length,
          )
        : 0;

    const highPriorityCount =
      analyzedListings.filter(
        (listing) =>
          listing.overallScore < 55,
      ).length;

    const opportunityCount =
      analyzedListings.reduce(
        (sum, listing) =>
          sum + listing.opportunityCount,
        0,
      );

    const lowestScoringListing =
      [...analyzedListings].sort(
        (first, second) =>
          first.overallScore -
          second.overallScore,
      )[0] ?? null;

    return {
      analyzedCount:
        analyzedListings.length,
      averageHealth,
      highPriorityCount,
      opportunityCount,
      lowestScoringListing,
    };
  }, [listings]);

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-3">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="h-9 w-80" />
              <Skeleton className="h-5 w-96 max-w-full" />
              <Skeleton className="h-10 w-48" />
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[520px]">
              {Array.from({ length: 3 }).map(
                (_, index) => (
                  <Skeleton
                    key={index}
                    className="h-28 rounded-xl"
                  />
                ),
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 text-red-700" />

            <div>
              <p className="font-semibold text-red-700">
                Shop opportunities could not be loaded
              </p>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (opportunityData.analyzedCount === 0) {
    return (
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background">
        <CardContent className="p-6">
          <Badge
            variant="outline"
            className="mb-4 gap-2"
          >
            <Sparkles className="size-3.5" />
            Shop optimization overview
          </Badge>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Connect your Etsy listings
          </h1>

          <p className="mt-2 text-muted-foreground">
            SellerOS needs listing data before it can
            identify optimization opportunities.
          </p>

          <Button
            className="mt-5"
            nativeButton={false}
            render={<Link href="/listings" />}
          >
            Open listings
            <ArrowRight className="size-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background">
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-2xl">
            <Badge
              variant="outline"
              className="mb-4 gap-2"
            >
              <Sparkles className="size-3.5" />
              Live shop opportunities
            </Badge>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Your shop optimization overview
            </h1>

            <p className="mt-2 text-muted-foreground">
              SellerOS found{" "}
              {opportunityData.opportunityCount}{" "}
              {opportunityData.opportunityCount === 1
                ? "listing area"
                : "listing areas"}{" "}
              that may benefit from improvement across{" "}
              {opportunityData.analyzedCount}{" "}
              {opportunityData.analyzedCount === 1
                ? "listing"
                : "listings"}.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                nativeButton={false}
                render={<Link href="/listings" />}
              >
                Review listings
                <ArrowRight className="size-4" />
              </Button>

              {opportunityData.lowestScoringListing ? (
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={
                    <Link
                      href={`/audit/${opportunityData.lowestScoringListing.id}`}
                    />
                  }
                >
                  Audit lowest score
                </Button>
              ) : (
                <Button
                  variant="outline"
                  disabled
                >
                  Audit lowest score
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[520px]">
            <div className="rounded-xl border bg-background/80 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ListChecks className="size-4" />

                <span className="text-sm">
                  Improvement areas
                </span>
              </div>

              <p className="mt-3 text-2xl font-bold">
                {opportunityData.opportunityCount}
              </p>
            </div>

            <div className="rounded-xl border bg-background/80 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertTriangle className="size-4" />

                <span className="text-sm">
                  High priority
                </span>
              </div>

              <p className="mt-3 text-2xl font-bold">
                {opportunityData.highPriorityCount}
              </p>
            </div>

            <div className="rounded-xl border bg-background/80 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <HeartPulse className="size-4" />

                <span className="text-sm">
                  Average health
                </span>
              </div>

              <p className="mt-3 text-2xl font-bold">
                {opportunityData.averageHealth}

                <span className="text-sm font-normal text-muted-foreground">
                  /100
                </span>
              </p>
            </div>
          </div>
        </div>

        <p className="mt-5 text-xs text-muted-foreground">
          Opportunities are SellerOS estimates based on
          listing content and do not guarantee Etsy
          traffic, rankings, or sales.
        </p>
      </CardContent>
    </Card>
  );
}