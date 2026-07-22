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
      <div className="mx-auto w-full max-w-7xl">
        <div className="space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-5 w-full max-w-2xl" />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
      <div className="mx-auto w-full max-w-7xl">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">
              Listings could not be loaded
            </CardTitle>

            <CardDescription>
              SellerOS could not prepare the AI
              auditor.
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
          <FileSearch className="size-8" />
          AI Listing Auditor
        </h1>

        <p className="mt-2 max-w-2xl text-muted-foreground">
          Select a listing to review its title, tags,
          description, images, pricing, recommendations,
          and AI optimization tools.
        </p>
      </div>

      {sortedListings.length > 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedListings.map(
            ({ listing, analysis }) => (
              <Card
                key={listing.id}
                className="flex h-full flex-col transition-shadow hover:shadow-md"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <Badge variant="outline">
                      {listing.status}
                    </Badge>

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

                  <CardTitle className="line-clamp-2 pt-2 text-lg">
                    {listing.title?.trim() ||
                      "Untitled listing"}
                  </CardTitle>

                  <CardDescription>
                    Listing ID: {listing.id}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">
                        Overall score
                      </p>

                      <p className="mt-1 text-2xl font-bold">
                        {analysis.scores.overall}
                        <span className="text-sm font-normal text-muted-foreground">
                          /100
                        </span>
                      </p>
                    </div>

                    <div className="rounded-lg border bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">
                        Weakest area
                      </p>

                      <p className="mt-1 font-semibold">
                        {
                          analysis.weakestCategory
                            .category
                        }
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {
                          analysis.weakestCategory
                            .score
                        }
                        /100
                      </p>
                    </div>
                  </div>

                  <Button
                    className="mt-5 w-full"
                    nativeButton={false}
                    render={
                      <Link
                        href={`/audit/${listing.id}`}
                      />
                    }
                  >
                    Open AI Audit
                    <ArrowRight className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      ) : (
        <Card className="mt-6">
          <CardContent className="p-10 text-center">
            <SearchCheck className="mx-auto size-10 text-muted-foreground" />

            <p className="mt-4 font-semibold">
              No listings available
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Connect Etsy listings before opening the
              AI auditor.
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
    </div>
  );
}