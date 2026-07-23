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
              Keyword insights could not be loaded
            </CardTitle>

            <CardDescription className="wrap-break-words">
              SellerOS could not analyze your listing
              titles and tags.
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

  if (listings.length === 0) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4 lg:px-0">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            SellerOS Growth Tools
          </p>

          <h1 className="mt-2 flex min-w-0 items-start gap-2 wrap-break-words text-2xl font-bold tracking-tight sm:items-center sm:gap-3 sm:text-3xl">
            <Tags className="mt-0.5 size-6 shrink-0 sm:mt-0 sm:size-8" />

            <span className="min-w-0">
              Keyword Insights
            </span>
          </h1>
        </div>

        <Card className="mt-4 min-w-0 sm:mt-6">
          <CardContent className="px-4 py-6 text-center sm:p-10">
            <Search className="mx-auto size-9 text-muted-foreground sm:size-10" />

            <p className="mt-4 font-semibold">
              No listings available
            </p>

            <p className="mt-2 wrap-break-words text-sm text-muted-foreground">
              Connect Etsy listings before analyzing
              your titles and tags.
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
    <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4 lg:px-0">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">
          SellerOS Growth Tools
        </p>

        <h1 className="mt-2 flex min-w-0 items-start gap-2 wrap-break-words text-2xl font-bold tracking-tight sm:items-center sm:gap-3 sm:text-3xl">
          <Tags className="mt-0.5 size-6 shrink-0 sm:mt-0 sm:size-8" />

          <span className="min-w-0">
            Keyword Insights
          </span>
        </h1>

        <p className="mt-2 max-w-2xl wrap-break-words text-sm leading-6 text-muted-foreground sm:text-base">
          Explore the tags and title keywords used
          across your connected Etsy listings.
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
              Most-Used Tags
            </CardTitle>

            <CardDescription className="wrap-break-words">
              Number of listings using each exact tag.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            {keywordData.topTags.length > 0 ? (
              <div className="flex min-w-0 flex-wrap gap-2">
                {keywordData.topTags.map(
                  (item) => (
                    <Badge
                      key={item.keyword}
                      variant="secondary"
                      className="max-w-full gap-2 whitespace-normal wrap-break-words px-3 py-1.5"
                    >
                      <span className="wrap-break-words">
                        {item.keyword}
                      </span>

                      <span className="shrink-0 text-xs text-muted-foreground">
                        {item.listingCount}
                      </span>
                    </Badge>
                  ),
                )}
              </div>
            ) : (
              <p className="wrap-break-words text-sm text-muted-foreground">
                No usable tags were found.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
            <CardTitle className="wrap-break-words text-base sm:text-lg">
              Common Title Keywords
            </CardTitle>

            <CardDescription className="wrap-break-words">
              Number of listings containing each
              keyword in the title.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            {keywordData.topTitleKeywords
              .length > 0 ? (
              <div className="flex min-w-0 flex-wrap gap-2">
                {keywordData.topTitleKeywords.map(
                  (item) => (
                    <Badge
                      key={item.keyword}
                      variant="outline"
                      className="max-w-full gap-2 whitespace-normal wrap-break-words px-3 py-1.5"
                    >
                      <span className="wrap-break-words">
                        {item.keyword}
                      </span>

                      <span className="shrink-0 text-xs text-muted-foreground">
                        {item.listingCount}
                      </span>
                    </Badge>
                  ),
                )}
              </div>
            ) : (
              <p className="wrap-break-words text-sm text-muted-foreground">
                No usable title keywords were found.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4 min-w-0 sm:mt-6">
        <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="flex min-w-0 items-center gap-2 text-base sm:text-lg">
                <AlertTriangle className="size-5 shrink-0" />

                <span className="wrap-break-words">
                  Listings With Unused Tags
                </span>
              </CardTitle>

              <CardDescription className="mt-1 wrap-break-words">
                Listings using the fewest unique tags
                appear first.
              </CardDescription>
            </div>

            <Badge
              variant="outline"
              className="w-fit shrink-0"
            >
              Top 5
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          {keywordData.lowTagListings.length >
          0 ? (
            <div className="min-w-0 space-y-3">
              {keywordData.lowTagListings.map(
                (listing) => (
                  <div
                    key={listing.id}
                    className="flex min-w-0 flex-col gap-3 rounded-xl border p-3 sm:gap-4 sm:p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="line-clamp-2 wrap-break-words font-medium">
                        {listing.title}
                      </p>

                      <p className="mt-1 wrap-break-words text-sm text-muted-foreground">
                        {listing.tagCount}/13 unique
                        tags used
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full shrink-0 md:w-auto"
                      nativeButton={false}
                      render={
                        <Link
                          href={`/audit/${listing.id}`}
                        />
                      }
                    >
                      Review Tags
                      <ArrowRight className="size-4 shrink-0" />
                    </Button>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-5 text-center sm:p-8">
              <Tags className="mx-auto size-9 text-emerald-600" />

              <p className="mt-3 wrap-break-words font-medium">
                Every listing uses all 13 tags
              </p>
            </div>
          )}

          <p className="mt-4 wrap-break-words text-xs leading-5 text-muted-foreground">
            Keyword frequency shows how often phrases
            appear in your own listings. It does not
            measure Etsy search volume or competition.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}