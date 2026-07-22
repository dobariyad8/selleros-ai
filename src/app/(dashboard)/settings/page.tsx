"use client";

import {
  RefreshCw,
  Settings,
  Store,
  Unplug,
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

export default function SettingsPage() {
  const {
    shop,
    totalAvailable,
    isRefreshing,
    error,
    refreshListings,
  } = useListings();

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div>
        <p className="text-sm text-muted-foreground">
          SellerOS
        </p>

        <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold tracking-tight">
          <Settings className="size-8" />
          Settings
        </h1>

        <p className="mt-2 max-w-2xl text-muted-foreground">
          Review your connected Etsy shop and manually
          refresh the listing data used throughout
          SellerOS.
        </p>
      </div>

      <div className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Store className="size-5" />
                  Etsy Shop Connection
                </CardTitle>

                <CardDescription className="mt-1">
                  Shop information currently available
                  to SellerOS.
                </CardDescription>
              </div>

              <Badge
                variant={
                  shop ? "default" : "secondary"
                }
              >
                {shop ? "Connected" : "Not connected"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            {shop ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground">
                    Shop name
                  </p>

                  <p className="mt-2 font-semibold">
                    {shop.shopName}
                  </p>
                </div>

                <div className="rounded-xl border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground">
                    Shop ID
                  </p>

                  <p className="mt-2 font-semibold">
                    {shop.shopId}
                  </p>
                </div>

                <div className="rounded-xl border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground">
                    Listings available
                  </p>

                  <p className="mt-2 font-semibold">
                    {totalAvailable}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-6">
                <p className="font-medium">
                  No Etsy shop information available
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  SellerOS could not find a connected
                  Etsy shop in the current session.
                </p>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                nativeButton={false}
                render={
                  <a href="/api/auth/etsy/login" />
                }
              >
                <Store className="size-4" />
            
                {shop
                  ? "Reconnect Etsy Shop"
                  : "Connect Etsy Shop"}
              </Button>
                
              {shop && (
                <form
                  action="/api/auth/etsy/disconnect"
                  method="post"
                >
                  <Button
                    type="submit"
                    variant="destructive"
                  >
                    <Unplug className="size-4" />
                    Disconnect Etsy Shop
                  </Button>
                </form>
              )}
            </div>

            {error && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Listing Data
            </CardTitle>

            <CardDescription>
              Refresh listings from Etsy to update
              dashboard scores and recommendations.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Button
              type="button"
              onClick={() => {
                void refreshListings();
              }}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`size-4 ${
                  isRefreshing
                    ? "animate-spin"
                    : ""
                }`}
              />

              {isRefreshing
                ? "Refreshing Listings"
                : "Refresh Etsy Listings"}
            </Button>

            <p className="mt-3 text-xs text-muted-foreground">
              Refreshing replaces the current listing
              collection with the latest data returned
              by the Etsy connection.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}