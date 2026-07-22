"use client";

import { useMemo } from "react";
import {
  CircleAlert,
  CircleCheck,
  HeartPulse,
} from "lucide-react";

import { useListings } from "@/hooks/useListings";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

import { calculateAverageScore } from "@/lib/scoring/analyzeListing";

type HealthScore = {
  name: string;
  score: number;
};

function getScoreLabel(score: number) {
  if (score >= 85) {
    return "Excellent";
  }

  if (score >= 70) {
    return "Needs attention";
  }

  return "Needs improvement";
}

function getBadgeVariant(score: number) {
  if (score >= 85) {
    return "default" as const;
  }

  if (score >= 70) {
    return "secondary" as const;
  }

  return "destructive" as const;
}

function ScoreStatusIcon({
  score,
}: {
  score: number;
}) {
  if (score >= 85) {
    return <CircleCheck className="size-4" />;
  }

  return <CircleAlert className="size-4" />;
}

export default function ShopHealthCard() {
  const {
    analyzedListings,
    isLoading,
    error,
  } = useListings();

  const healthData = useMemo(() => {
    const analyses = analyzedListings.map(
      ({ analysis }) => analysis,
    );

    const scores: HealthScore[] = [
      {
        name: "Titles",
        score: calculateAverageScore(
          analyses.map(
            (analysis) =>
              analysis.scores.title,
          ),
        ),
      },
      {
        name: "Tags",
        score: calculateAverageScore(
          analyses.map(
            (analysis) =>
              analysis.scores.tags,
          ),
        ),
      },
      {
        name: "Descriptions",
        score: calculateAverageScore(
          analyses.map(
            (analysis) =>
              analysis.scores.description,
          ),
        ),
      },
      {
        name: "Images",
        score: calculateAverageScore(
          analyses.map(
            (analysis) =>
              analysis.scores.images,
          ),
        ),
      },
      {
        name: "Pricing",
        score: calculateAverageScore(
          analyses.map(
            (analysis) =>
              analysis.scores.pricing,
          ),
        ),
      },
    ];

    return {
      overallScore: calculateAverageScore(
        analyses.map(
          (analysis) =>
            analysis.scores.overall,
        ),
      ),
      scores,
      analyzedCount: analyses.length,
    };
  }, [analyzedListings]);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>

        <CardContent className="space-y-5">
          <Skeleton className="h-28 rounded-xl" />

          {Array.from({ length: 5 }).map(
            (_, index) => (
              <div
                key={index}
                className="space-y-2"
              >
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>

                <Skeleton className="h-2 w-full" />
              </div>
            ),
          )}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <HeartPulse className="size-5" />
            Shop Health Score
          </CardTitle>

          <CardDescription>
            The shop-health data could not be
            calculated.
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

  if (healthData.analyzedCount === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HeartPulse className="size-5" />
            Shop Health Score
          </CardTitle>

          <CardDescription>
            A summary of your Etsy listing
            quality.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="rounded-xl border border-dashed p-8 text-center">
            <CircleAlert className="mx-auto size-8 text-muted-foreground" />

            <p className="mt-3 font-medium">
              No listings available
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Connect or load Etsy listings to
              calculate your shop health.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <HeartPulse className="size-5" />
              Shop Health Score
            </CardTitle>

            <CardDescription className="mt-1">
              Average quality across your connected
              Etsy listings.
            </CardDescription>
          </div>

          <Badge
            variant="outline"
            className="shrink-0"
          >
            {healthData.analyzedCount}{" "}
            {healthData.analyzedCount === 1
              ? "listing"
              : "listings"}{" "}
            analyzed
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-6 flex items-end justify-between gap-4 rounded-xl border bg-muted/30 p-4">
          <div>
            <p className="text-4xl font-bold tracking-tight">
              {healthData.overallScore}

              <span className="text-lg font-medium text-muted-foreground">
                /100
              </span>
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Average overall shop health
            </p>
          </div>

          <Badge
            variant={getBadgeVariant(
              healthData.overallScore,
            )}
          >
            {getScoreLabel(
              healthData.overallScore,
            )}
          </Badge>
        </div>

        <div className="space-y-5">
          {healthData.scores.map((item) => (
            <div key={item.name}>
              <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {item.name}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Average listing-quality score
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">
                    {item.score}/100
                  </span>

                  <Badge
                    variant={getBadgeVariant(
                      item.score,
                    )}
                    className="gap-1"
                  >
                    <ScoreStatusIcon
                      score={item.score}
                    />

                    {getScoreLabel(item.score)}
                  </Badge>
                </div>
              </div>

              <Progress value={item.score} />
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Scores are SellerOS estimates based on
          listing content and do not guarantee Etsy
          traffic, rankings, or sales.
        </p>
      </CardContent>
    </Card>
  );
}