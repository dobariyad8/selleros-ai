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
      <div className="mx-auto w-full max-w-7xl">
        <div className="space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-5 w-full max-w-2xl" />
        </div>

        <div className="mt-6 space-y-4">
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
      <div className="mx-auto w-full max-w-7xl">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">
              Listing rankings could not be loaded
            </CardTitle>

            <CardDescription>
              SellerOS could not calculate listing
              health rankings.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div>
        <p className="text-sm text-muted-foreground">
          SellerOS Growth Tools
        </p>

        <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold tracking-tight">
          <Trophy className="size-8" />
          Top Listing Scores
        </h1>

        <p className="mt-2 max-w-2xl text-muted-foreground">
          Listings ranked by their SellerOS content
          health score across titles, tags,
          descriptions, images, and pricing.
        </p>
      </div>

      {rankedListings.length > 0 ? (
        <div className="mt-6 space-y-4">
          {rankedListings.map(
            ({ listing, analysis }, index) => (
              <Card
                key={listing.id}
                className="transition-shadow hover:shadow-md"
              >
                <CardContent className="p-5">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                    <div className="flex items-center gap-4 lg:w-20">
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
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="line-clamp-2 font-semibold">
                            {listing.title?.trim() ||
                              "Untitled listing"}
                          </p>

                          <p className="mt-1 text-sm text-muted-foreground">
                            Listing ID: {listing.id}
                          </p>
                        </div>

                        <Badge
                          variant={getScoreVariant(
                            analysis.scores.overall,
                          )}
                        >
                          {getScoreLabel(
                            analysis.scores.overall,
                          )}
                        </Badge>
                      </div>

                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="text-sm text-muted-foreground">
                            Overall listing health
                          </p>

                          <p className="font-semibold">
                            {analysis.scores.overall}/100
                          </p>
                        </div>

                        <Progress
                          value={
                            analysis.scores.overall
                          }
                        />
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
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
                            className="rounded-lg border bg-muted/30 p-2.5"
                          >
                            <p className="text-xs text-muted-foreground">
                              {item.name}
                            </p>

                            <p className="mt-1 font-semibold">
                              {item.score}/100
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="shrink-0"
                      nativeButton={false}
                      render={
                        <Link
                          href={`/audit/${listing.id}`}
                        />
                      }
                    >
                      Open Audit
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      ) : (
        <Card className="mt-6">
          <CardContent className="p-10 text-center">
            <Trophy className="mx-auto size-10 text-muted-foreground" />

            <p className="mt-4 font-semibold">
              No listings available
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Connect Etsy listings before calculating
              listing rankings.
            </p>

            <Button
              className="mt-5"
              nativeButton={false}
              render={<Link href="/listings" />}
            >
              Open Listings
              <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      <p className="mt-5 text-xs text-muted-foreground">
        Rankings are based on SellerOS content-health
        scores, not Etsy sales, traffic, conversion,
        or search position.
      </p>
    </div>
  );
}