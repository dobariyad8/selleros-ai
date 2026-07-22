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
import {
  analyzeListing,
  calculateAverageScore,
} from "@/lib/scoring/analyzeListing";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AIOpportunitySummary() {
  const {
    listings,
    isLoading,
    error,
  } = useListings();

  const opportunityData = useMemo(() => {
    const analyzedListings = listings.map(
      (listing) => {
        const analysis =
          analyzeListing(listing);

        return {
          id: String(listing.id),
          title:
            listing.title?.trim() ||
            "Untitled listing",
          overallScore:
            analysis.scores.overall,
          opportunityCount:
            analysis.opportunityCount,
        };
      },
    );

    const averageHealth =
      calculateAverageScore(
        analyzedListings.map(
          (listing) =>
            listing.overallScore,
        ),
      );

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
      analyzedListings.reduce<
        (typeof analyzedListings)[number] | null
      >((lowest, current) => {
        if (
          !lowest ||
          current.overallScore <
            lowest.overallScore
        ) {
          return current;
        }

        return lowest;
      }, null);

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

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-130">
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
      <Card className="overflow-hidden border-primary/20 bg-linear-to-br from-primary/10 via-background to-background">
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
    <Card className="overflow-hidden border-primary/20 bg-linear-to-br from-primary/10 via-background to-background">
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

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-130">
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