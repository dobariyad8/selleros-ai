"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CameraOff,
  CircleCheckBig,
  ImageIcon,
  Images,
  TriangleAlert,
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

function getImageStatus(imageCount: number) {
  if (imageCount >= 7) {
    return {
      label: "Strong gallery",
      variant: "default" as const,
    };
  }

  if (imageCount >= 4) {
    return {
      label: "Could add more",
      variant: "secondary" as const,
    };
  }

  return {
    label: "Needs images",
    variant: "destructive" as const,
  };
}

export default function ImagesPage() {
  const {
    analyzedListings,
    isLoading,
    error,
  } = useListings();

  const imageData = useMemo(() => {
    const listingImages = analyzedListings.map(
      ({ listing, analysis }) => {
        const imageCount = (
          listing.imageUrls ?? []
        ).filter(Boolean).length;

        return {
          id: String(listing.id),
          title:
            listing.title?.trim() ||
            "Untitled listing",
          imageCount,
          imageScore:
            analysis.scores.images,
          overallScore:
            analysis.scores.overall,
        };
      },
    );

    const totalImages = listingImages.reduce(
      (total, listing) =>
        total + listing.imageCount,
      0,
    );

    const averageImages =
      listingImages.length > 0
        ? (
            totalImages /
            listingImages.length
          ).toFixed(1)
        : "0";

    const distribution = [
      {
        name: "No images",
        description:
          "Listings with no image URLs",
        count: listingImages.filter(
          (listing) =>
            listing.imageCount === 0,
        ).length,
      },
      {
        name: "1–3 images",
        description:
          "Listings with limited image coverage",
        count: listingImages.filter(
          (listing) =>
            listing.imageCount >= 1 &&
            listing.imageCount <= 3,
        ).length,
      },
      {
        name: "4–6 images",
        description:
          "Listings with moderate image coverage",
        count: listingImages.filter(
          (listing) =>
            listing.imageCount >= 4 &&
            listing.imageCount <= 6,
        ).length,
      },
      {
        name: "7+ images",
        description:
          "Listings with stronger galleries",
        count: listingImages.filter(
          (listing) =>
            listing.imageCount >= 7,
        ).length,
      },
    ];

    return {
      listingCount:
        listingImages.length,

      totalImages,

      averageImages,

      noImageCount:
        listingImages.filter(
          (listing) =>
            listing.imageCount === 0,
        ).length,

      strongGalleryCount:
        listingImages.filter(
          (listing) =>
            listing.imageCount >= 7,
        ).length,

      distribution,

      listingsNeedingImages: [
        ...listingImages,
      ]
        .filter(
          (listing) =>
            listing.imageCount < 7,
        )
        .sort((first, second) => {
          if (
            first.imageCount !==
            second.imageCount
          ) {
            return (
              first.imageCount -
              second.imageCount
            );
          }

          if (
            first.imageScore !==
            second.imageScore
          ) {
            return (
              first.imageScore -
              second.imageScore
            );
          }

          return first.title.localeCompare(
            second.title,
          );
        })
        .slice(0, 10),
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
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>

        <Skeleton className="mt-4 h-96 rounded-xl sm:mt-6" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4 lg:px-0">
        <Card className="min-w-0 border-red-200">
          <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
            <CardTitle className="wrap-break-words text-red-700">
              Image insights could not be loaded
            </CardTitle>

            <CardDescription className="wrap-break-words">
              SellerOS could not analyze the image
              coverage of your listings.
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

  if (imageData.listingCount === 0) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4 lg:px-0">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            SellerOS Growth Tools
          </p>

          <h1 className="mt-2 flex min-w-0 items-start gap-2 wrap-break-words text-2xl font-bold tracking-tight sm:items-center sm:gap-3 sm:text-3xl">
            <Images className="mt-0.5 size-6 shrink-0 sm:mt-0 sm:size-8" />

            <span className="min-w-0">
              Image Insights
            </span>
          </h1>
        </div>

        <Card className="mt-4 min-w-0 sm:mt-6">
          <CardContent className="px-4 py-6 text-center sm:p-10">
            <ImageIcon className="mx-auto size-9 text-muted-foreground sm:size-10" />

            <p className="mt-4 font-semibold">
              No listings available
            </p>

            <p className="mt-2 wrap-break-words text-sm text-muted-foreground">
              Connect Etsy listings before analyzing
              image coverage.
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
      value: String(
        imageData.listingCount,
      ),
      description:
        "Connected listings included",
    },
    {
      title: "Total Images",
      value: String(
        imageData.totalImages,
      ),
      description:
        "Image URLs found across listings",
    },
    {
      title: "Average Images",
      value: imageData.averageImages,
      description:
        "Average images per listing",
    },
    {
      title: "Strong Galleries",
      value: String(
        imageData.strongGalleryCount,
      ),
      description:
        "Listings containing 7 or more images",
    },
  ];

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4 lg:px-0">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">
          SellerOS Growth Tools
        </p>

        <h1 className="mt-2 flex min-w-0 items-start gap-2 wrap-break-words text-2xl font-bold tracking-tight sm:items-center sm:gap-3 sm:text-3xl">
          <Images className="mt-0.5 size-6 shrink-0 sm:mt-0 sm:size-8" />

          <span className="min-w-0">
            Image Insights
          </span>
        </h1>

        <p className="mt-2 max-w-2xl wrap-break-words text-sm leading-6 text-muted-foreground sm:text-base">
          Review image coverage across your connected
          Etsy listings and identify galleries that
          may need additional product views.
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
              Gallery Distribution
            </CardTitle>

            <CardDescription className="wrap-break-words">
              Listings grouped by the number of image
              URLs available.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 px-4 pb-4 sm:px-6 sm:pb-6">
            {imageData.distribution.map(
              (item) => {
                const percentage =
                  imageData.listingCount > 0
                    ? Math.round(
                        (item.count /
                          imageData.listingCount) *
                          100,
                      )
                    : 0;

                return (
                  <div
                    key={item.name}
                    className="min-w-0"
                  >
                    <div className="mb-2 flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="wrap-break-words text-sm font-medium">
                          {item.name}
                        </p>

                        <p className="wrap-break-words text-xs leading-5 text-muted-foreground">
                          {item.description}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="font-semibold">
                          {item.count}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {percentage}%
                        </p>
                      </div>
                    </div>

                    <Progress value={percentage} />
                  </div>
                );
              },
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
            <CardTitle className="wrap-break-words text-base sm:text-lg">
              Image Coverage Summary
            </CardTitle>

            <CardDescription className="wrap-break-words">
              Key gallery opportunities across your
              shop.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 px-4 pb-4 sm:space-y-4 sm:px-6 sm:pb-6">
            <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl border p-3 sm:p-4">
              <div className="flex min-w-0 items-start gap-3">
                <CameraOff className="mt-0.5 size-5 shrink-0 text-red-600" />

                <div className="min-w-0">
                  <p className="wrap-break-words font-medium">
                    No images found
                  </p>

                  <p className="wrap-break-words text-sm text-muted-foreground">
                    Listings without image URLs
                  </p>
                </div>
              </div>

              <p className="shrink-0 text-xl font-bold sm:text-2xl">
                {imageData.noImageCount}
              </p>
            </div>

            <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl border p-3 sm:p-4">
              <div className="flex min-w-0 items-start gap-3">
                <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-600" />

                <div className="min-w-0">
                  <p className="wrap-break-words font-medium">
                    Need more coverage
                  </p>

                  <p className="wrap-break-words text-sm text-muted-foreground">
                    Listings with fewer than 7 images
                  </p>
                </div>
              </div>

              <p className="shrink-0 text-xl font-bold sm:text-2xl">
                {
                  imageData
                    .listingsNeedingImages.length
                }
              </p>
            </div>

            <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl border p-3 sm:p-4">
              <div className="flex min-w-0 items-start gap-3">
                <CircleCheckBig className="mt-0.5 size-5 shrink-0 text-emerald-600" />

                <div className="min-w-0">
                  <p className="wrap-break-words font-medium">
                    Strong galleries
                  </p>

                  <p className="wrap-break-words text-sm text-muted-foreground">
                    Listings with at least 7 images
                  </p>
                </div>
              </div>

              <p className="shrink-0 text-xl font-bold sm:text-2xl">
                {imageData.strongGalleryCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4 min-w-0 sm:mt-6">
        <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="wrap-break-words text-base sm:text-lg">
                Listings Needing More Images
              </CardTitle>

              <CardDescription className="mt-1 wrap-break-words">
                Up to 10 listings with the fewest
                images appear first.
              </CardDescription>
            </div>

            <Badge
              variant="outline"
              className="w-fit shrink-0"
            >
              Top 10
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          {imageData.listingsNeedingImages.length >
          0 ? (
            <div className="min-w-0 space-y-3">
              {imageData.listingsNeedingImages.map(
                (listing) => {
                  const status =
                    getImageStatus(
                      listing.imageCount,
                    );

                  return (
                    <div
                      key={listing.id}
                      className="flex min-w-0 flex-col gap-3 rounded-xl border p-3 sm:gap-4 sm:p-4 lg:flex-row lg:items-center"
                    >
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <ImageIcon className="size-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 wrap-break-words font-medium">
                          {listing.title}
                        </p>

                        <p className="mt-1 wrap-break-words text-sm text-muted-foreground">
                          {listing.imageCount}{" "}
                          {listing.imageCount === 1
                            ? "image"
                            : "images"}{" "}
                          found
                        </p>
                      </div>

                      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
                        <Badge
                          variant={status.variant}
                          className="w-fit shrink-0"
                        >
                          {status.label}
                        </Badge>

                        <span className="wrap-break-words text-sm font-semibold">
                          Image score:{" "}
                          {listing.imageScore}/100
                        </span>

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full shrink-0 sm:w-auto"
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
                    </div>
                  );
                },
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-5 text-center sm:p-8">
              <CircleCheckBig className="mx-auto size-9 text-emerald-600" />

              <p className="mt-3 wrap-break-words font-medium">
                Every listing has a strong gallery
              </p>

              <p className="mt-1 wrap-break-words text-sm text-muted-foreground">
                All connected listings currently have
                at least seven image URLs.
              </p>
            </div>
          )}

          <p className="mt-4 wrap-break-words text-xs leading-5 text-muted-foreground">
            Image insights are based only on the number
            of image URLs available. SellerOS is not
            currently measuring brightness, sharpness,
            composition, background quality, or visual
            conversion performance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}