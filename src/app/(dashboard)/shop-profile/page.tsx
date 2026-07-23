"use client";

import Link from "next/link";
import {
  ArrowRight,
  CircleCheckBig,
  ExternalLink,
  Store,
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

export default function ShopProfilePage() {
  const {
    shop,
    listings,
    totalAvailable,
    isLoading,
    error,
  } = useListings();

  const activeListings = listings.filter(
    (listing) =>
      listing.status.toLowerCase() === "active",
  ).length;

  const listingsWithUrls = listings.filter(
    (listing) => Boolean(listing.listingUrl),
  );

  if (isLoading) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-5xl px-3 sm:px-4 lg:px-0">
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-64 max-w-full" />
          <Skeleton className="h-5 w-full max-w-2xl" />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map(
            (_, index) => (
              <Skeleton
                key={index}
                className="h-28 rounded-xl"
              />
            ),
          )}
        </div>

        <Skeleton className="mt-6 h-64 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-5xl px-3 sm:px-4 lg:px-0">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">
              Shop profile could not be loaded
            </CardTitle>

            <CardDescription>
              SellerOS could not retrieve your Etsy
              shop information.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="wrap-break-words rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-5xl px-3 sm:px-4 lg:px-0">
        <div>
          <p className="text-sm text-muted-foreground">
            SellerOS Account
          </p>

          <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <Store className="size-7 shrink-0" />
            Shop Profile
          </h1>
        </div>

        <Card className="mt-6">
          <CardContent className="p-6 text-center sm:p-10">
            <Store className="mx-auto size-10 text-muted-foreground" />

            <p className="mt-4 font-semibold">
              No Etsy shop connected
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Connect your Etsy shop to view its profile.
            </p>

            <Button
              className="mt-5 w-full sm:w-auto"
              nativeButton={false}
              render={<Link href="/settings" />}
            >
              Open Settings
              <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl px-3 sm:px-4 lg:px-0">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">
          SellerOS Account
        </p>

        <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
          <Store className="size-7 shrink-0" />
          Shop Profile
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Review the Etsy shop currently connected to
          SellerOS.
        </p>
      </div>

      <div className="mt-6 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm text-muted-foreground">
              Shop name
            </p>

            <p className="mt-2 wrap-break-words text-xl font-bold">
              {shop.shopName}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm text-muted-foreground">
              Listings available
            </p>

            <p className="mt-2 text-2xl font-bold">
              {totalAvailable}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm text-muted-foreground">
              Active listings
            </p>

            <p className="mt-2 text-2xl font-bold">
              {activeListings}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 min-w-0">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>
                Connected Etsy Shop
              </CardTitle>

              <CardDescription className="mt-1">
                Shop information returned by the Etsy
                connection.
              </CardDescription>
            </div>

            <Badge className="w-fit">
              <CircleCheckBig className="size-3.5" />
              Connected
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">
                Etsy shop name
              </p>

              <p className="mt-2 wrap-break-words font-semibold">
                {shop.shopName}
              </p>
            </div>

            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">
                Etsy shop ID
              </p>

              <p className="mt-2 break-all font-semibold">
                {shop.shopId}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              nativeButton={false}
              className="w-full sm:w-auto"
              render={<Link href="/listings" />}
            >
              View Listings
              <ArrowRight className="size-4" />
            </Button>

            {listingsWithUrls[0]?.listingUrl && (
              <Button
                variant="outline"
                nativeButton={false}
                className="w-full sm:w-auto"
                render={
                  <a
                    href={listingsWithUrls[0].listingUrl}
                    target="_blank"
                    rel="noreferrer"
                  />
                }
              >
                Open Etsy Listing
                <ExternalLink className="size-4" />
              </Button>
            )}

            <Button
              variant="outline"
              nativeButton={false}
              className="w-full sm:w-auto"
              render={<Link href="/settings" />}
            >
              Manage Connection
            </Button>
          </div>

          <p className="text-xs leading-5 text-muted-foreground">
            SellerOS currently receives the shop name,
            shop ID, and listing data from Etsy. Full
            shop branding, announcement, and biography
            fields are not yet imported.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}