"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  CircleCheckBig,
  RefreshCw,
  Settings,
  Store,
  Unplug,
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

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const etsyStatus = searchParams.get("etsy");

  const {
    shop,
    totalAvailable,
    isRefreshing,
    error,
    refreshListings,
  } = useListings();

  const shopName =
    shop?.shopName?.trim() || "Etsy Shop";

  const shopInitials =
    getShopInitials(shopName);

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl px-3 sm:px-4 lg:px-0">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">
          SellerOS Account
        </p>

        <h1 className="mt-2 flex min-w-0 items-start gap-2 wrap-break-words text-2xl font-bold tracking-tight sm:items-center sm:gap-3 sm:text-3xl">
          <Settings className="mt-0.5 size-6 shrink-0 sm:mt-0 sm:size-8" />

          <span className="min-w-0">
            Settings
          </span>
        </h1>

        <p className="mt-2 max-w-2xl wrap-break-words text-sm leading-6 text-muted-foreground sm:text-base">
          Manage your connected Etsy shop and refresh
          the listing data used throughout SellerOS.
        </p>
      </div>

      {etsyStatus === "connected" && (
        <div
          role="status"
          className="mt-4 flex min-w-0 items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 sm:mt-6"
        >
          <CircleCheckBig className="mt-0.5 size-5 shrink-0" />

          <div className="min-w-0">
            <p className="wrap-break-words font-semibold">
              Etsy shop connected
            </p>

            <p className="mt-1 wrap-break-words text-sm leading-6">
              SellerOS can now access your connected
              Etsy shop and listing data.
            </p>
          </div>
        </div>
      )}

      {etsyStatus === "disconnected" && (
        <div
          role="status"
          className="mt-4 flex min-w-0 items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 sm:mt-6"
        >
          <Unplug className="mt-0.5 size-5 shrink-0" />

          <div className="min-w-0">
            <p className="wrap-break-words font-semibold">
              Etsy shop disconnected
            </p>

            <p className="mt-1 wrap-break-words text-sm leading-6">
              The Etsy access and refresh tokens were
              removed from this browser.
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 min-w-0 space-y-4 sm:mt-6 sm:space-y-6">
        <Card className="min-w-0">
          <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <CardTitle className="flex min-w-0 items-center gap-2 text-base sm:text-lg">
                  <Store className="size-5 shrink-0" />

                  <span className="wrap-break-words">
                    Account Overview
                  </span>
                </CardTitle>

                <CardDescription className="mt-1 wrap-break-words">
                  Identity and connection details for
                  the Etsy shop used by SellerOS.
                </CardDescription>
              </div>

              <Badge
                variant={
                  shop ? "default" : "secondary"
                }
                className="w-fit shrink-0"
              >
                {shop ? (
                  <>
                    <CircleCheckBig className="size-3.5" />
                    Connected
                  </>
                ) : (
                  "Not connected"
                )}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            {shop ? (
              <>
                <div className="flex min-w-0 flex-col gap-4 rounded-xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="size-12 shrink-0">
                      <AvatarFallback className="font-semibold">
                        {shopInitials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <p className="wrap-break-words font-semibold">
                        {shopName}
                      </p>

                      <p className="mt-1 break-all text-sm text-muted-foreground">
                        Etsy Shop ID: {shop.shopId}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full shrink-0 sm:w-auto"
                    nativeButton={false}
                    render={
                      <Link href="/shop-profile" />
                    }
                  >
                    View Shop Profile
                    <ArrowRight className="size-4" />
                  </Button>
                </div>

                <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="min-w-0 rounded-xl border bg-muted/30 p-3 sm:p-4">
                    <p className="text-xs text-muted-foreground">
                      Shop name
                    </p>

                    <p className="mt-2 wrap-break-words font-semibold">
                      {shopName}
                    </p>
                  </div>

                  <div className="min-w-0 rounded-xl border bg-muted/30 p-3 sm:p-4">
                    <p className="text-xs text-muted-foreground">
                      Shop ID
                    </p>

                    <p className="mt-2 break-all font-semibold">
                      {shop.shopId}
                    </p>
                  </div>

                  <div className="min-w-0 rounded-xl border bg-muted/30 p-3 sm:p-4">
                    <p className="text-xs text-muted-foreground">
                      Listings available
                    </p>

                    <p className="mt-2 wrap-break-words font-semibold">
                      {totalAvailable}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="min-w-0 rounded-xl border border-dashed p-5 sm:p-6">
                <div className="flex min-w-0 items-start gap-3">
                  <Avatar className="size-11 shrink-0">
                    <AvatarFallback className="text-xs font-semibold">
                      ES
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <p className="wrap-break-words font-medium">
                      No Etsy shop connected
                    </p>

                    <p className="mt-1 wrap-break-words text-sm leading-6 text-muted-foreground">
                      Connect an Etsy shop to load your
                      account identity and listing data.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                className="w-full sm:w-auto"
                nativeButton={false}
                render={
                  <a href="/api/auth/etsy/login" />
                }
              >
                <Store className="size-4 shrink-0" />

                {shop
                  ? "Reconnect Etsy Shop"
                  : "Connect Etsy Shop"}
              </Button>

              {shop && (
                <form
                  action="/api/auth/etsy/disconnect"
                  method="post"
                  className="w-full sm:w-auto"
                >
                  <Button
                    type="submit"
                    variant="destructive"
                    className="w-full sm:w-auto"
                  >
                    <Unplug className="size-4 shrink-0" />
                    Disconnect Etsy Shop
                  </Button>
                </form>
              )}
            </div>

            {error && (
              <div
                role="alert"
                className="mt-4 min-w-0 wrap-break-words rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
            <CardTitle className="wrap-break-words text-base sm:text-lg">
              Listing Data
            </CardTitle>

            <CardDescription className="wrap-break-words">
              Refresh listings from Etsy to update
              dashboard scores and recommendations.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => {
                void refreshListings();
              }}
              disabled={isRefreshing || !shop}
            >
              <RefreshCw
                className={`size-4 shrink-0 ${
                  isRefreshing
                    ? "animate-spin"
                    : ""
                }`}
              />

              {isRefreshing
                ? "Refreshing Listings"
                : "Refresh Etsy Listings"}
            </Button>

            <p className="mt-3 wrap-break-words text-xs leading-5 text-muted-foreground">
              {shop
                ? "Refreshing replaces the current listing collection with the latest data returned by the Etsy connection."
                : "Connect an Etsy shop before refreshing listing data."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}