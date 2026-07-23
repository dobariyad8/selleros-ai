"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CircleCheckBig,
  TriangleAlert,
} from "lucide-react";

import { useListings } from "@/hooks/useListings";
import { calculateAverageScore } from "@/lib/scoring/analyzeListing";

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

const scoreCategories = [
  {
    name: "Titles",
    scoreKey: "title" as const,
  },
  {
    name: "Tags",
    scoreKey: "tags" as const,
  },
  {
    name: "Descriptions",
    scoreKey: "description" as const,
  },
  {
    name: "Images",
    scoreKey: "images" as const,
  },
  {
    name: "Pricing",
    scoreKey: "pricing" as const,
  },
];

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

export default function AnalyticsPage() {
  const {
    analyzedListings,
    isLoading,
    error,
  } = useListings();

  const analytics = useMemo(() => {
    const overallScores = analyzedListings.map(
      ({ analysis }) => analysis.scores.overall,
    );

    const categoryAverages = scoreCategories.map(
      (category) => ({
        name: category.name,
        score: calculateAverageScore(
          analyzedListings.map(
            ({ analysis }) =>
              analysis.scores[category.scoreKey],
          ),
        ),
      }),
    );

    const strongestCategory =
      categoryAverages.reduce<
        (typeof categoryAverages)[number] | null
      >((strongest, current) => {
        if (
          !strongest ||
          current.score > strongest.score
        ) {
          return current;
        }

        return strongest;
      }, null);

    const weakestCategory =
      categoryAverages.reduce<
        (typeof categoryAverages)[number] | null
      >((weakest, current) => {
        if (
          !weakest ||
          current.score < weakest.score
        ) {
          return current;
        }

        return weakest;
      }, null);

    return {
      listingCount: analyzedListings.length,
      averageHealth:
        calculateAverageScore(overallScores),
      excellentCount: overallScores.filter(
        (score) => score >= 85,
      ).length,
      attentionCount: overallScores.filter(
        (score) =>
          score >= 70 && score < 85,
      ).length,
      improvementCount: overallScores.filter(
        (score) => score < 70,
      ).length,
      categoryAverages,
      strongestCategory,
      weakestCategory,
    };
  }, [analyzedListings]);

  if (isLoading) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4 lg:px-0">
        <div className="min-w-0 space-y-3">
          <Skeleton className="h-4 w-40 max-w-full" />
          <Skeleton className="h-10 w-64 max-w-full" />
          <Skeleton className="h-5 w-full max-w-2xl" />
        </div>

        <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }).map(
            (_, index) => (
              <Skeleton
                key={index}
                className="h-28 rounded-xl"
              />
            ),
          )}
        </div>

        <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 sm:mt-6 sm:gap-6 xl:grid-cols-2">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
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
              Analytics could not be loaded
            </CardTitle>

            <CardDescription className="wrap-break-words">
              SellerOS could not calculate your listing
              health analytics.
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

  if (analytics.listingCount === 0) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4 lg:px-0">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            SellerOS Growth Tools
          </p>

          <h1 className="mt-2 flex min-w-0 items-start gap-2 wrap-break-words text-2xl font-bold tracking-tight sm:items-center sm:gap-3 sm:text-3xl">
            <BarChart3 className="mt-0.5 size-6 shrink-0 sm:mt-0 sm:size-8" />

            <span className="min-w-0">
              Listing Analytics
            </span>
          </h1>
        </div>

        <Card className="mt-4 min-w-0 sm:mt-6">
          <CardContent className="px-4 py-6 text-center sm:p-10">
            <Activity className="mx-auto size-9 text-muted-foreground sm:size-10" />

            <p className="mt-4 font-semibold">
              No listings available
            </p>

            <p className="mt-2 wrap-break-words text-sm text-muted-foreground">
              Connect Etsy listings before calculating
              shop analytics.
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
      </div>
    );
  }

  const summaryCards = [
    {
      title: "Listings Analyzed",
      value: String(analytics.listingCount),
      description:
        "Connected listings included in this report",
    },
    {
      title: "Average Health",
      value: `${analytics.averageHealth}/100`,
      description:
        "Average overall SellerOS score",
    },
    {
      title: "Excellent",
      value: String(analytics.excellentCount),
      description:
        "Listings scoring 85 or higher",
    },
    {
      title: "Needs Improvement",
      value: String(
        analytics.improvementCount,
      ),
      description:
        "Listings scoring below 70",
    },
  ];

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4 lg:px-0">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">
          SellerOS Growth Tools
        </p>

        <h1 className="mt-2 flex min-w-0 items-start gap-2 wrap-break-words text-2xl font-bold tracking-tight sm:items-center sm:gap-3 sm:text-3xl">
          <BarChart3 className="mt-0.5 size-6 shrink-0 sm:mt-0 sm:size-8" />

          <span className="min-w-0">
            Listing Analytics
          </span>
        </h1>

        <p className="mt-2 max-w-2xl wrap-break-words text-sm leading-6 text-muted-foreground sm:text-base">
          Understand the content health of your Etsy
          listings across titles, tags, descriptions,
          images, and pricing.
        </p>
      </div>

      <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <Card
            key={item.title}
            className="min-w-0"
          >
            <CardContent className="p-4 sm:p-5">
              <p className="wrap-break-words text-sm text-muted-foreground">
                {item.title}
              </p>

              <p className="mt-2 wrap-break-words text-2xl font-bold sm:text-3xl">
                {item.value}
              </p>

              <p className="mt-2 wrap-break-words text-xs leading-5 text-muted-foreground">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 sm:mt-6 sm:gap-6 xl:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
            <CardTitle className="wrap-break-words text-base sm:text-lg">
              Category Performance
            </CardTitle>

            <CardDescription className="wrap-break-words">
              Average score for each listing area.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 px-4 pb-4 sm:px-6 sm:pb-6">
            {analytics.categoryAverages.map(
              (category) => (
                <div
                  key={category.name}
                  className="min-w-0"
                >
                  <div className="mb-2 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <p className="wrap-break-words text-sm font-medium">
                      {category.name}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="shrink-0 text-sm font-semibold">
                        {category.score}/100
                      </span>

                      <Badge
                        variant={getScoreVariant(
                          category.score,
                        )}
                        className="w-fit shrink-0"
                      >
                        {getScoreLabel(
                          category.score,
                        )}
                      </Badge>
                    </div>
                  </div>

                  <Progress
                    value={category.score}
                  />
                </div>
              ),
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
            <CardTitle className="wrap-break-words text-base sm:text-lg">
              Score Distribution
            </CardTitle>

            <CardDescription className="wrap-break-words">
              Number of listings in each health range.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 px-4 pb-4 sm:space-y-4 sm:px-6 sm:pb-6">
            <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl border p-3 sm:p-4">
              <div className="flex min-w-0 items-start gap-3">
                <CircleCheckBig className="mt-0.5 size-5 shrink-0 text-emerald-600" />

                <div className="min-w-0">
                  <p className="wrap-break-words font-medium">
                    Excellent
                  </p>

                  <p className="wrap-break-words text-sm text-muted-foreground">
                    Scores from 85 to 100
                  </p>
                </div>
              </div>

              <p className="shrink-0 text-xl font-bold sm:text-2xl">
                {analytics.excellentCount}
              </p>
            </div>

            <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl border p-3 sm:p-4">
              <div className="flex min-w-0 items-start gap-3">
                <Activity className="mt-0.5 size-5 shrink-0 text-amber-600" />

                <div className="min-w-0">
                  <p className="wrap-break-words font-medium">
                    Needs Attention
                  </p>

                  <p className="wrap-break-words text-sm text-muted-foreground">
                    Scores from 70 to 84
                  </p>
                </div>
              </div>

              <p className="shrink-0 text-xl font-bold sm:text-2xl">
                {analytics.attentionCount}
              </p>
            </div>

            <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl border p-3 sm:p-4">
              <div className="flex min-w-0 items-start gap-3">
                <TriangleAlert className="mt-0.5 size-5 shrink-0 text-red-600" />

                <div className="min-w-0">
                  <p className="wrap-break-words font-medium">
                    Needs Improvement
                  </p>

                  <p className="wrap-break-words text-sm text-muted-foreground">
                    Scores below 70
                  </p>
                </div>
              </div>

              <p className="shrink-0 text-xl font-bold sm:text-2xl">
                {analytics.improvementCount}
              </p>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
              <div className="min-w-0 rounded-xl border bg-muted/30 p-3 sm:p-4">
                <p className="text-xs text-muted-foreground">
                  Strongest category
                </p>

                <p className="mt-2 wrap-break-words font-semibold">
                  {analytics.strongestCategory?.name}
                </p>

                <p className="wrap-break-words text-sm text-muted-foreground">
                  {analytics.strongestCategory?.score}/100
                </p>
              </div>

              <div className="min-w-0 rounded-xl border bg-muted/30 p-3 sm:p-4">
                <p className="text-xs text-muted-foreground">
                  Weakest category
                </p>

                <p className="mt-2 wrap-break-words font-semibold">
                  {analytics.weakestCategory?.name}
                </p>

                <p className="wrap-break-words text-sm text-muted-foreground">
                  {analytics.weakestCategory?.score}/100
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="mt-5 wrap-break-words text-xs leading-5 text-muted-foreground">
        These analytics describe listing-content health.
        They do not represent Etsy sales, views,
        conversion rates, search volume, or ranking.
      </p>
    </div>
  );
}