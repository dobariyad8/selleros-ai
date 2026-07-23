"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Medal,
  Trophy,
} from "lucide-react";

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
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

function getScoreLabel(score: number) {
  if (score >= 85) {
    return "Excellent";
  }

  if (score >= 70) {
    return "Needs attention";
  }

  return "Needs improvement";
}

function getScoreVariant(score: number) {
  if (score >= 85) {
    return "default" as const;
  }

  if (score >= 70) {
    return "secondary" as const;
  }

  return "destructive" as const;
}

export default function TopPerformersPage() {
  const {
    analyzedListings,
    isLoading,
    error,
  } = useListings();

  const rankedListings = useMemo(
    () =>
      [...analyzedListings]
        .sort((first, second) => {
          if (
            first.analysis.scores.overall !==
            second.analysis.scores.overall
          ) {
            return (
              second.analysis.scores.overall -
              first.analysis.scores.overall
            );
          }

          return first.listing.title.localeCompare(
            second.listing.title,
          );
        })
        .slice(0, 10),
    [analyzedListings],
  );

  if (isLoading) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4 lg:px-0">
        <div className="min-w-0 space-y-3">
          <Skeleton className="h-4 w-40 max-w-full" />
          <Skeleton className="h-10 w-72 max-w-full" />
          <Skeleton className="h-5 w-full max-w-2xl" />
        </div>

        <div className="mt-4 min-w-0 space-y-3 sm:mt-6 sm:space-y-4">
          {Array.from({ length: 6 }).map(
            (_, index) => (
              <Skeleton
                key={index}
                className="h-40 rounded-xl"
              />
            ),
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4 lg:px-0">
        <Card className="min-w-0 border-red-200">
          <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
            <CardTitle className="wrap-break-words text-red-700">
              Listing rankings could not be loaded
            </CardTitle>

            <CardDescription className="wrap-break-words">
              SellerOS could not calculate listing
              health rankings.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="min-w-0 wrap-break-words rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4 lg:px-0">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">
          SellerOS Growth Tools
        </p>

        <h1 className="mt-2 flex min-w-0 items-start gap-2 wrap-break-words text-2xl font-bold tracking-tight sm:items-center sm:gap-3 sm:text-3xl">
          <Trophy className="mt-0.5 size-6 shrink-0 sm:mt-0 sm:size-8" />

          <span className="min-w-0">
            Top Listing Scores
          </span>
        </h1>

        <p className="mt-2 max-w-2xl wrap-break-words text-sm leading-6 text-muted-foreground sm:text-base">
          Listings ranked by their SellerOS content
          health score across titles, tags,
          descriptions, images, and pricing.
        </p>
      </div>

      {rankedListings.length > 0 ? (
        <div className="mt-4 min-w-0 space-y-3 sm:mt-6 sm:space-y-4">
          {rankedListings.map(
            ({ listing, analysis }, index) => (
              <Card
                key={listing.id}
                className="min-w-0 transition-shadow hover:shadow-md"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:gap-5">
                    <div className="flex min-w-0 items-center gap-3 lg:w-20 lg:shrink-0 lg:gap-4">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-full border bg-muted/40 text-lg font-bold">
                        {index < 3 ? (
                          <Medal className="size-5" />
                        ) : (
                          index + 1
                        )}
                      </div>

                      <p className="text-sm font-medium lg:hidden">
                        Rank #{index + 1}
                      </p>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                        <div className="min-w-0">
                          <p className="line-clamp-2 wrap-break-words font-semibold">
                            {listing.title?.trim() ||
                              "Untitled listing"}
                          </p>

                          <p className="mt-1 break-all text-sm text-muted-foreground">
                            Listing ID: {listing.id}
                          </p>
                        </div>

                        <Badge
                          variant={getScoreVariant(
                            analysis.scores.overall,
                          )}
                          className="w-fit shrink-0"
                        >
                          {getScoreLabel(
                            analysis.scores.overall,
                          )}
                        </Badge>
                      </div>

                      <div className="mt-4 min-w-0">
                        <div className="mb-2 flex min-w-0 items-center justify-between gap-3">
                          <p className="min-w-0 wrap-break-words text-sm text-muted-foreground">
                            Overall listing health
                          </p>

                          <p className="shrink-0 font-semibold">
                            {analysis.scores.overall}/100
                          </p>
                        </div>

                        <Progress
                          value={
                            analysis.scores.overall
                          }
                        />
                      </div>

                      <div className="mt-4 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                        {[
                          {
                            name: "Title",
                            score:
                              analysis.scores.title,
                          },
                          {
                            name: "Tags",
                            score:
                              analysis.scores.tags,
                          },
                          {
                            name: "Description",
                            score:
                              analysis.scores
                                .description,
                          },
                          {
                            name: "Images",
                            score:
                              analysis.scores.images,
                          },
                          {
                            name: "Pricing",
                            score:
                              analysis.scores.pricing,
                          },
                        ].map((item) => (
                          <div
                            key={item.name}
                            className="min-w-0 rounded-lg border bg-muted/30 p-2.5"
                          >
                            <p className="wrap-break-words text-xs text-muted-foreground">
                              {item.name}
                            </p>

                            <p className="mt-1 wrap-break-words font-semibold">
                              {item.score}/100
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full shrink-0 lg:w-auto"
                      nativeButton={false}
                      render={
                        <Link
                          href={`/audit/${listing.id}`}
                        />
                      }
                    >
                      Open Audit
                      <ArrowRight className="size-4 shrink-0" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      ) : (
        <Card className="mt-4 min-w-0 sm:mt-6">
          <CardContent className="px-4 py-6 text-center sm:p-10">
            <Trophy className="mx-auto size-9 text-muted-foreground sm:size-10" />

            <p className="mt-4 font-semibold">
              No listings available
            </p>

            <p className="mt-2 wrap-break-words text-sm text-muted-foreground">
              Connect Etsy listings before calculating
              listing rankings.
            </p>

            <Button
              className="mt-5 w-full sm:w-auto"
              nativeButton={false}
              render={<Link href="/listings" />}
            >
              Open Listings
              <ArrowRight className="size-4 shrink-0" />
            </Button>
          </CardContent>
        </Card>
      )}

      <p className="mt-5 wrap-break-words text-xs leading-5 text-muted-foreground">
        Rankings are based on SellerOS content-health
        scores, not Etsy sales, traffic, conversion,
        or search position.
      </p>
    </div>
  );
}