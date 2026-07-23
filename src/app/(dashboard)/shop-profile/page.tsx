"use client";

import Link from "next/link";
import {
  ArrowRight,
  CircleCheckBig,
  ExternalLink,
  Store,
} from "lucide-react";

import { useListings } from "@/hooks/useListings";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
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

function getShopInitials(shopName: string) {
  const words = shopName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "ES";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

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

  const inactiveListings = listings.filter(
    (listing) =>
      listing.status.toLowerCase() !== "active",
  ).length;

  const listingsWithImages = listings.filter(
    (listing) =>
      (listing.imageUrls ?? []).length > 0,
  ).length;

  const etsyShopUrl = shop
    ? `https://www.etsy.com/shop/${encodeURIComponent(
        shop.shopName,
      )}`
    : null;

  if (isLoading) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-5xl px-3 sm:px-4 lg:px-0">
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-64 max-w-full" />
          <Skeleton className="h-5 w-full max-w-2xl" />
        </div>

        <Skeleton className="mt-6 h-40 rounded-xl" />

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

  const summaryCards = [
    {
      title: "Listings Available",
      value: String(totalAvailable),
      description:
        "Listings returned by Etsy",
    },
    {
      title: "Active Listings",
      value: String(activeListings),
      description:
        "Listings currently marked active",
    },
    {
      title: "Other Statuses",
      value: String(inactiveListings),
      description:
        "Draft, inactive, or sold-out listings",
    },
    {
      title: "With Images",
      value: String(listingsWithImages),
      description:
        "Listings containing image URLs",
    },
  ];

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

      <Card className="mt-6 min-w-0 overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar className="size-14 shrink-0 sm:size-16">
                <AvatarFallback className="text-lg font-bold">
                  {getShopInitials(shop.shopName)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="wrap-break-words text-xl font-bold sm:text-2xl">
                    {shop.shopName}
                  </h2>

                  <Badge className="w-fit">
                    <CircleCheckBig className="size-3.5" />
                    Connected
                  </Badge>
                </div>

                <p className="mt-1 break-all text-sm text-muted-foreground">
                  Etsy Shop ID: {shop.shopId}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              nativeButton={false}
              className="w-full shrink-0 sm:w-auto"
              render={
                <a
                  href={etsyShopUrl ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                />
              }
            >
              Open Etsy Shop
              <ExternalLink className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <Card
            key={item.title}
            className="min-w-0"
          >
            <CardContent className="p-4 sm:p-5">
              <p className="wrap-break-words text-sm text-muted-foreground">
                {item.title}
              </p>

              <p className="mt-2 wrap-break-words text-2xl font-bold">
                {item.value}
              </p>

              <p className="mt-2 wrap-break-words text-xs leading-5 text-muted-foreground">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6 min-w-0">
        <CardHeader>
          <CardTitle>
            Connected Etsy Shop
          </CardTitle>

          <CardDescription>
            Shop information currently available to
            SellerOS.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="min-w-0 rounded-xl border bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">
                Etsy shop name
              </p>

              <p className="mt-2 wrap-break-words font-semibold">
                {shop.shopName}
              </p>
            </div>

            <div className="min-w-0 rounded-xl border bg-muted/30 p-4">
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

            <Button
              variant="outline"
              nativeButton={false}
              className="w-full sm:w-auto"
              render={
                <a
                  href={etsyShopUrl ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                />
              }
            >
              Visit Etsy Shop
              <ExternalLink className="size-4" />
            </Button>

            <Button
              variant="outline"
              nativeButton={false}
              className="w-full sm:w-auto"
              render={<Link href="/settings" />}
            >
              Manage Connection
            </Button>
          </div>

          <p className="wrap-break-words text-xs leading-5 text-muted-foreground">
            SellerOS currently receives the shop name,
            shop ID, and listing data from Etsy. Full
            shop branding, announcement, biography,
            reviews, and sales totals are not yet
            imported.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}