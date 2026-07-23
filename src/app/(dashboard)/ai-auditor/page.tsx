"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  FileSearch,
  SearchCheck,
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

export default function AIAuditorPage() {
  const {
    analyzedListings,
    isLoading,
    error,
  } = useListings();

  const sortedListings = useMemo(
    () =>
      [...analyzedListings].sort(
        (first, second) =>
          first.analysis.scores.overall -
          second.analysis.scores.overall,
      ),
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

        <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
          {Array.from({ length: 6 }).map(
            (_, index) => (
              <Skeleton
                key={index}
                className="h-52 rounded-xl"
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
              Listings could not be loaded
            </CardTitle>

            <CardDescription className="wrap-break-words">
              SellerOS could not prepare the AI
              auditor.
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
          <FileSearch className="mt-0.5 size-6 shrink-0 sm:mt-0 sm:size-8" />
          <span className="min-w-0">
            AI Listing Auditor
          </span>
        </h1>

        <p className="mt-2 max-w-2xl wrap-break-words text-sm leading-6 text-muted-foreground sm:text-base">
          Select a listing to review its title, tags,
          description, images, pricing, recommendations,
          and AI optimization tools.
        </p>
      </div>

      {sortedListings.length > 0 ? (
        <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
          {sortedListings.map(
            ({ listing, analysis }) => (
              <Card
                key={listing.id}
                className="flex h-full min-w-0 flex-col transition-shadow hover:shadow-md"
              >
                <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <Badge
                      variant="outline"
                      className="w-fit max-w-full shrink-0 whitespace-normal wrap-break-words"
                    >
                      {listing.status}
                    </Badge>

                    <Badge
                      variant={getScoreVariant(
                        analysis.scores.overall,
                      )}
                      className="w-fit max-w-full shrink-0 whitespace-normal wrap-break-words"
                    >
                      {getScoreLabel(
                        analysis.scores.overall,
                      )}
                    </Badge>
                  </div>

                  <CardTitle className="line-clamp-2 wrap-break-words pt-2 text-base sm:text-lg">
                    {listing.title?.trim() ||
                      "Untitled listing"}
                  </CardTitle>

                  <CardDescription className="break-all">
                    Listing ID: {listing.id}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex min-w-0 flex-1 flex-col px-4 pb-4 sm:px-6 sm:pb-6">
                  <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="min-w-0 rounded-lg border bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">
                        Overall score
                      </p>

                      <p className="mt-1 wrap-break-words text-xl font-bold sm:text-2xl">
                        {analysis.scores.overall}
                        <span className="text-sm font-normal text-muted-foreground">
                          /100
                        </span>
                      </p>
                    </div>

                    <div className="min-w-0 rounded-lg border bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">
                        Weakest area
                      </p>

                      <p className="mt-1 wrap-break-words font-semibold">
                        {
                          analysis.weakestCategory
                            .category
                        }
                      </p>

                      <p className="wrap-break-words text-sm text-muted-foreground">
                        {
                          analysis.weakestCategory
                            .score
                        }
                        /100
                      </p>
                    </div>
                  </div>

                  <Button
                    className="mt-4 w-full sm:mt-5"
                    nativeButton={false}
                    render={
                      <Link
                        href={`/audit/${listing.id}`}
                      />
                    }
                  >
                    Open AI Audit
                    <ArrowRight className="size-4 shrink-0" />
                  </Button>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      ) : (
        <Card className="mt-4 min-w-0 sm:mt-6">
          <CardContent className="px-4 py-6 text-center sm:p-10">
            <SearchCheck className="mx-auto size-9 text-muted-foreground sm:size-10" />

            <p className="mt-4 font-semibold">
              No listings available
            </p>

            <p className="mt-2 wrap-break-words text-sm text-muted-foreground">
              Connect Etsy listings before opening the
              AI auditor.
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
    </div>
  );
}