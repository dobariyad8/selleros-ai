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
      <div className="mx-auto w-full max-w-7xl">
        <div className="space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-full max-w-2xl" />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map(
            (_, index) => (
              <Skeleton
                key={index}
                className="h-28 rounded-xl"
              />
            ),
          )}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
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
              Analytics could not be loaded
            </CardTitle>

            <CardDescription>
              SellerOS could not calculate your listing
              health analytics.
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

  if (analytics.listingCount === 0) {
    return (
      <div className="mx-auto w-full max-w-7xl">
        <div>
          <p className="text-sm text-muted-foreground">
            SellerOS Growth Tools
          </p>

          <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold tracking-tight">
            <BarChart3 className="size-8" />
            Listing Analytics
          </h1>
        </div>

        <Card className="mt-6">
          <CardContent className="p-10 text-center">
            <Activity className="mx-auto size-10 text-muted-foreground" />

            <p className="mt-4 font-semibold">
              No listings available
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Connect Etsy listings before calculating
              shop analytics.
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
    <div className="mx-auto w-full max-w-7xl">
      <div>
        <p className="text-sm text-muted-foreground">
          SellerOS Growth Tools
        </p>

        <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold tracking-tight">
          <BarChart3 className="size-8" />
          Listing Analytics
        </h1>

        <p className="mt-2 max-w-2xl text-muted-foreground">
          Understand the content health of your Etsy
          listings across titles, tags, descriptions,
          images, and pricing.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <Card key={item.title}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">
                {item.title}
              </p>

              <p className="mt-2 text-3xl font-bold">
                {item.value}
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              Category Performance
            </CardTitle>

            <CardDescription>
              Average score for each listing area.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {analytics.categoryAverages.map(
              (category) => (
                <div key={category.name}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <p className="text-sm font-medium">
                      {category.name}
                    </p>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">
                        {category.score}/100
                      </span>

                      <Badge
                        variant={getScoreVariant(
                          category.score,
                        )}
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

        <Card>
          <CardHeader>
            <CardTitle>
              Score Distribution
            </CardTitle>

            <CardDescription>
              Number of listings in each health range.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <CircleCheckBig className="size-5 text-emerald-600" />

                <div>
                  <p className="font-medium">
                    Excellent
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Scores from 85 to 100
                  </p>
                </div>
              </div>

              <p className="text-2xl font-bold">
                {analytics.excellentCount}
              </p>
            </div>

            <div className="flex items-center justify-between rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <Activity className="size-5 text-amber-600" />

                <div>
                  <p className="font-medium">
                    Needs Attention
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Scores from 70 to 84
                  </p>
                </div>
              </div>

              <p className="text-2xl font-bold">
                {analytics.attentionCount}
              </p>
            </div>

            <div className="flex items-center justify-between rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <TriangleAlert className="size-5 text-red-600" />

                <div>
                  <p className="font-medium">
                    Needs Improvement
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Scores below 70
                  </p>
                </div>
              </div>

              <p className="text-2xl font-bold">
                {analytics.improvementCount}
              </p>
            </div>

            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">
                  Strongest category
                </p>

                <p className="mt-2 font-semibold">
                  {analytics.strongestCategory?.name}
                </p>

                <p className="text-sm text-muted-foreground">
                  {analytics.strongestCategory?.score}/100
                </p>
              </div>

              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">
                  Weakest category
                </p>

                <p className="mt-2 font-semibold">
                  {analytics.weakestCategory?.name}
                </p>

                <p className="text-sm text-muted-foreground">
                  {analytics.weakestCategory?.score}/100
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="mt-5 text-xs text-muted-foreground">
        These analytics describe listing-content health.
        They do not represent Etsy sales, views,
        conversion rates, search volume, or ranking.
      </p>
    </div>
  );
}