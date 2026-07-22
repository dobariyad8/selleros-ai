"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Search,
  Tags,
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

const STOP_WORDS = new Set([
  "and",
  "the",
  "for",
  "with",
  "from",
  "this",
  "that",
  "your",
  "you",
  "set",
  "gift",
  "etsy",
  "item",
  "product",
]);

type KeywordUsage = {
  keyword: string;
  listingCount: number;
};

function normalizePhrase(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function extractTitleKeywords(title: string) {
  return title
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((word) => word.trim())
    .filter(
      (word) =>
        word.length >= 3 &&
        !STOP_WORDS.has(word),
    );
}

function sortKeywordUsage(
  keywordMap: Map<string, number>,
): KeywordUsage[] {
  return Array.from(keywordMap.entries())
    .map(([keyword, listingCount]) => ({
      keyword,
      listingCount,
    }))
    .sort((first, second) => {
      if (
        first.listingCount !==
        second.listingCount
      ) {
        return (
          second.listingCount -
          first.listingCount
        );
      }

      return first.keyword.localeCompare(
        second.keyword,
      );
    });
}

function createUsageMap(
  values: string[],
): Map<string, number> {
  const uniqueValues = Array.from(
    new Set(values),
  );

  return new Map(
    uniqueValues.map((value) => [
      value,
      values.filter(
        (item) => item === value,
      ).length,
    ]),
  );
}

export default function KeywordsPage() {
  const {
    listings,
    isLoading,
    error,
  } = useListings();

  const keywordData = useMemo(() => {
  const listingKeywordData = listings.map(
    (listing) => {
      const normalizedTags = (
        listing.tags ?? []
      )
        .map(normalizePhrase)
        .filter(Boolean);

      const uniqueTags = Array.from(
        new Set(normalizedTags),
      );

      const uniqueTitleKeywords =
        Array.from(
          new Set(
            extractTitleKeywords(
              listing.title ?? "",
            ),
          ),
        );

      return {
        id: String(listing.id),

        title:
          listing.title?.trim() ||
          "Untitled listing",

        tagCount: uniqueTags.length,
        tags: uniqueTags,
        titleKeywords:
          uniqueTitleKeywords,
      };
    },
  );

  const allTags =
    listingKeywordData.flatMap(
      (listing) => listing.tags,
    );

  const allTitleKeywords =
    listingKeywordData.flatMap(
      (listing) =>
        listing.titleKeywords,
    );

  const tagUsage =
    createUsageMap(allTags);

  const titleKeywordUsage =
    createUsageMap(allTitleKeywords);

  const totalTagCount =
    listingKeywordData.reduce(
      (total, listing) =>
        total + listing.tagCount,
      0,
    );

  const fullTagListings =
    listingKeywordData.filter(
      (listing) =>
        listing.tagCount >= 13,
    ).length;

  const unusedTagOpportunities =
    listingKeywordData.reduce(
      (total, listing) =>
        total +
        Math.max(
          0,
          13 - listing.tagCount,
        ),
      0,
    );

  const averageTags =
    listings.length > 0
      ? (
          totalTagCount /
          listings.length
        ).toFixed(1)
      : "0";

  return {
    uniqueTagCount: tagUsage.size,
    averageTags,
    fullTagListings,
    unusedTagOpportunities,

    topTags: sortKeywordUsage(
      tagUsage,
    ).slice(0, 20),

    topTitleKeywords:
      sortKeywordUsage(
        titleKeywordUsage,
      ).slice(0, 20),

    lowTagListings:
      listingKeywordData
        .filter(
          (listing) =>
            listing.tagCount < 13,
        )
        .sort(
          (first, second) =>
            first.tagCount -
            second.tagCount,
        )
        .slice(0, 5),
  };
}, [listings]);

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
              Keyword insights could not be loaded
            </CardTitle>

            <CardDescription>
              SellerOS could not analyze your listing
              titles and tags.
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

  if (listings.length === 0) {
    return (
      <div className="mx-auto w-full max-w-7xl">
        <div>
          <p className="text-sm text-muted-foreground">
            SellerOS Growth Tools
          </p>

          <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold tracking-tight">
            <Tags className="size-8" />
            Keyword Insights
          </h1>
        </div>

        <Card className="mt-6">
          <CardContent className="p-10 text-center">
            <Search className="mx-auto size-10 text-muted-foreground" />

            <p className="mt-4 font-semibold">
              No listings available
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Connect Etsy listings before analyzing
              your titles and tags.
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
      title: "Unique Tags",
      value: String(
        keywordData.uniqueTagCount,
      ),
      description:
        "Distinct tags across connected listings",
    },
    {
      title: "Average Tags",
      value: keywordData.averageTags,
      description:
        "Average unique tags per listing",
    },
    {
      title: "Using All 13",
      value: String(
        keywordData.fullTagListings,
      ),
      description:
        "Listings using every tag position",
    },
    {
      title: "Unused Tag Slots",
      value: String(
        keywordData.unusedTagOpportunities,
      ),
      description:
        "Available tag positions across the shop",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div>
        <p className="text-sm text-muted-foreground">
          SellerOS Growth Tools
        </p>

        <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold tracking-tight">
          <Tags className="size-8" />
          Keyword Insights
        </h1>

        <p className="mt-2 max-w-2xl text-muted-foreground">
          Explore the tags and title keywords used
          across your connected Etsy listings.
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
              Most-Used Tags
            </CardTitle>

            <CardDescription>
              Number of listings using each exact tag.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {keywordData.topTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {keywordData.topTags.map(
                  (item) => (
                    <Badge
                      key={item.keyword}
                      variant="secondary"
                      className="gap-2 px-3 py-1.5"
                    >
                      {item.keyword}

                      <span className="text-xs text-muted-foreground">
                        {item.listingCount}
                      </span>
                    </Badge>
                  ),
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No usable tags were found.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Common Title Keywords
            </CardTitle>

            <CardDescription>
              Number of listings containing each
              keyword in the title.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {keywordData.topTitleKeywords
              .length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {keywordData.topTitleKeywords.map(
                  (item) => (
                    <Badge
                      key={item.keyword}
                      variant="outline"
                      className="gap-2 px-3 py-1.5"
                    >
                      {item.keyword}

                      <span className="text-xs text-muted-foreground">
                        {item.listingCount}
                      </span>
                    </Badge>
                  ),
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No usable title keywords were found.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5" />
                Listings With Unused Tags
              </CardTitle>

              <CardDescription className="mt-1">
                Listings using the fewest unique tags
                appear first.
              </CardDescription>
            </div>

            <Badge variant="outline">
              Top 5
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {keywordData.lowTagListings.length >
          0 ? (
            <div className="space-y-3">
              {keywordData.lowTagListings.map(
                (listing) => (
                  <div
                    key={listing.id}
                    className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="line-clamp-2 font-medium">
                        {listing.title}
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {listing.tagCount}/13 unique
                        tags used
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
                      Review Tags
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <Tags className="mx-auto size-9 text-emerald-600" />

              <p className="mt-3 font-medium">
                Every listing uses all 13 tags
              </p>
            </div>
          )}

          <p className="mt-4 text-xs text-muted-foreground">
            Keyword frequency shows how often phrases
            appear in your own listings. It does not
            measure Etsy search volume or competition.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}