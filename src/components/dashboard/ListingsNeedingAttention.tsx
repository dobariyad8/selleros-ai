"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CircleDollarSign,
  FileText,
  ImageIcon,
  SearchCheck,
  Tags,
} from "lucide-react";

import { useListings } from "@/hooks/useListings";
import type { ListingScoreCategory } from "@/lib/scoring/analyzeListing";

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

type ListingPriority = "High" | "Medium" | "Low";

type ListingAttention = {
  id: string;
  title: string;
  issue: string;
  issueCategory: ListingScoreCategory;
  score: number;
  weakestScore: number;
  priority: ListingPriority;
};

function getPriorityVariant(
  priority: ListingPriority,
) {
  if (priority === "High") {
    return "destructive" as const;
  }

  if (priority === "Medium") {
    return "secondary" as const;
  }

  return "outline" as const;
}

function getPriority(
  score: number,
): ListingPriority {
  if (score < 55) {
    return "High";
  }

  if (score < 70) {
    return "Medium";
  }

  return "Low";
}

function getIssueIcon(
  category: ListingScoreCategory,
) {
  if (category === "Images") {
    return ImageIcon;
  }

  if (category === "Tags") {
    return Tags;
  }

  if (category === "Description") {
    return FileText;
  }

  if (category === "Pricing") {
    return CircleDollarSign;
  }

  return SearchCheck;
}

function getIssueMessage(
  category: ListingScoreCategory,
  score: number,
) {
  if (category === "Title") {
    return `Title is the weakest area at ${score}/100. Review its length, readability, and keyword variety.`;
  }

  if (category === "Tags") {
    return `Tags are the weakest area at ${score}/100. Improve tag usage, specificity, and title alignment.`;
  }

  if (category === "Description") {
    return `Description is the weakest area at ${score}/100. Add clearer structure and useful buyer details.`;
  }

  if (category === "Images") {
    return `Images are the weakest area at ${score}/100. Add more unique and informative product images.`;
  }

  return `Pricing is the weakest area at ${score}/100. Review the price and compare it with similar products.`;
}

export default function ListingsNeedingAttention() {
  const {
    analyzedListings,
    isLoading,
    error,
  } = useListings();

  const attentionData = useMemo(() => {
    const attentionListings: ListingAttention[] =
      analyzedListings.map(
        ({ listing, analysis }) => {
          const weakestCategory =
            analysis.weakestCategory;

          return {
            id: String(listing.id),
            title:
              listing.title?.trim() ||
              "Untitled listing",
            issueCategory:
              weakestCategory.category,
            issue: getIssueMessage(
              weakestCategory.category,
              weakestCategory.score,
            ),
            score: analysis.scores.overall,
            weakestScore:
              weakestCategory.score,
            priority: getPriority(
              analysis.scores.overall,
            ),
          };
        },
      );

    const allNeedingAttention =
      attentionListings
        .filter((listing) => listing.score < 80)
        .sort((first, second) => {
          if (first.score !== second.score) {
            return first.score - second.score;
          }

          return (
            first.weakestScore -
            second.weakestScore
          );
        });

    return {
      totalCount: allNeedingAttention.length,
      visibleListings:
        allNeedingAttention.slice(0, 3),
    };
  }, [analyzedListings]);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>

        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map(
            (_, index) => (
              <Skeleton
                key={index}
                className="h-36 rounded-xl"
              />
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
            <AlertTriangle className="size-5" />
            AI Action Center
          </CardTitle>

          <CardDescription>
            Listings needing attention could not be
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

  return (
    <Card className="h-full transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5" />
              AI Action Center
            </CardTitle>

            <CardDescription className="mt-1">
              Your top three lowest-scoring listings,
              ranked by optimization priority.
            </CardDescription>
          </div>

          <Badge
            variant="outline"
            className="shrink-0"
          >
            {attentionData.totalCount}{" "}
            {attentionData.totalCount === 1
              ? "action"
              : "actions"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {attentionData.visibleListings.length > 0 ? (
          <div className="space-y-3">
            {attentionData.visibleListings.map(
              (listing) => {
                const IssueIcon = getIssueIcon(
                  listing.issueCategory,
                );

                return (
                  <div
                    key={listing.id}
                    className="group rounded-xl border p-4 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <IssueIcon className="size-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="line-clamp-2 font-medium">
                              {listing.title}
                            </p>

                            <p className="mt-1 text-sm text-muted-foreground">
                              {listing.issue}
                            </p>
                          </div>

                          <Badge
                            variant={getPriorityVariant(
                              listing.priority,
                            )}
                          >
                            {listing.priority}
                          </Badge>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Overall listing score
                            </p>

                            <p className="text-lg font-semibold">
                              {listing.score}

                              <span className="text-sm font-normal text-muted-foreground">
                                /100
                              </span>
                            </p>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            nativeButton={false}
                            render={
                              <Link
                                href={`/audit/${listing.id}`}
                              />
                            }
                          >
                            Review Audit
                            <ArrowRight className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <SearchCheck className="mx-auto size-9 text-emerald-600" />

            <p className="mt-3 font-medium">
              No urgent listing issues
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              All connected listings currently score
              80 or higher.
            </p>
          </div>
        )}

        <Button
          variant="ghost"
          className="mt-4 w-full"
          nativeButton={false}
          render={<Link href="/listings" />}
        >
          View all listings
          <ArrowRight className="size-4" />
        </Button>

        <p className="mt-3 text-xs text-muted-foreground">
          Priorities are SellerOS estimates based on
          listing-content scores and do not guarantee
          Etsy rankings, traffic, or sales.
        </p>
      </CardContent>
    </Card>
  );
}