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
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>

        <Skeleton className="mt-6 h-96 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-7xl">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">
              Image insights could not be loaded
            </CardTitle>

            <CardDescription>
              SellerOS could not analyze the image
              coverage of your listings.
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

  if (imageData.listingCount === 0) {
    return (
      <div className="mx-auto w-full max-w-7xl">
        <div>
          <p className="text-sm text-muted-foreground">
            SellerOS Growth Tools
          </p>

          <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold tracking-tight">
            <Images className="size-8" />
            Image Insights
          </h1>
        </div>

        <Card className="mt-6">
          <CardContent className="p-10 text-center">
            <ImageIcon className="mx-auto size-10 text-muted-foreground" />

            <p className="mt-4 font-semibold">
              No listings available
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Connect Etsy listings before analyzing
              image coverage.
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
    <div className="mx-auto w-full max-w-7xl">
      <div>
        <p className="text-sm text-muted-foreground">
          SellerOS Growth Tools
        </p>

        <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold tracking-tight">
          <Images className="size-8" />
          Image Insights
        </h1>

        <p className="mt-2 max-w-2xl text-muted-foreground">
          Review image coverage across your connected
          Etsy listings and identify galleries that
          may need additional product views.
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
              Gallery Distribution
            </CardTitle>

            <CardDescription>
              Listings grouped by the number of image
              URLs available.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
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
                  <div key={item.name}>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">
                          {item.name}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      </div>

                      <div className="text-right">
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

        <Card>
          <CardHeader>
            <CardTitle>
              Image Coverage Summary
            </CardTitle>

            <CardDescription>
              Key gallery opportunities across your
              shop.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <CameraOff className="size-5 text-red-600" />

                <div>
                  <p className="font-medium">
                    No images found
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Listings without image URLs
                  </p>
                </div>
              </div>

              <p className="text-2xl font-bold">
                {imageData.noImageCount}
              </p>
            </div>

            <div className="flex items-center justify-between rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <TriangleAlert className="size-5 text-amber-600" />

                <div>
                  <p className="font-medium">
                    Need more coverage
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Listings with fewer than 7 images
                  </p>
                </div>
              </div>

              <p className="text-2xl font-bold">
                {
                  imageData
                    .listingsNeedingImages.length
                }
              </p>
            </div>

            <div className="flex items-center justify-between rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <CircleCheckBig className="size-5 text-emerald-600" />

                <div>
                  <p className="font-medium">
                    Strong galleries
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Listings with at least 7 images
                  </p>
                </div>
              </div>

              <p className="text-2xl font-bold">
                {imageData.strongGalleryCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>
                Listings Needing More Images
              </CardTitle>

              <CardDescription className="mt-1">
                Up to 10 listings with the fewest
                images appear first.
              </CardDescription>
            </div>

            <Badge variant="outline">
              Top 10
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {imageData.listingsNeedingImages.length >
          0 ? (
            <div className="space-y-3">
              {imageData.listingsNeedingImages.map(
                (listing) => {
                  const status =
                    getImageStatus(
                      listing.imageCount,
                    );

                  return (
                    <div
                      key={listing.id}
                      className="flex flex-col gap-4 rounded-xl border p-4 lg:flex-row lg:items-center"
                    >
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <ImageIcon className="size-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 font-medium">
                          {listing.title}
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {listing.imageCount}{" "}
                          {listing.imageCount === 1
                            ? "image"
                            : "images"}{" "}
                          found
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <Badge
                          variant={status.variant}
                        >
                          {status.label}
                        </Badge>

                        <span className="text-sm font-semibold">
                          Image score:{" "}
                          {listing.imageScore}/100
                        </span>

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
                          Open Audit
                          <ArrowRight className="size-4" />
                        </Button>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <CircleCheckBig className="mx-auto size-9 text-emerald-600" />

              <p className="mt-3 font-medium">
                Every listing has a strong gallery
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                All connected listings currently have
                at least seven image URLs.
              </p>
            </div>
          )}

          <p className="mt-4 text-xs text-muted-foreground">
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