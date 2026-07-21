"use client";

import { useState } from "react";
import { fetchLiveEtsyListings } from "@/lib/etsy/fetch-live-listings";
import type { LiveEtsyListing } from "@/lib/etsy/live-listing-types";
import { Button } from "@/components/ui/button";

export default function LiveEtsyTest() {
  const [listings, setListings] = useState<LiveEtsyListing[]>([]);
  const [shopName, setShopName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLoadListings() {
    try {
      setIsLoading(true);
      setError("");

      const result = await fetchLiveEtsyListings();

      setListings(result.listings);
      setShopName(result.shopName);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while loading Etsy listings.";

      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border p-6">
      <div>
        <h2 className="text-lg font-semibold">Live Etsy Connection</h2>

        <p className="text-sm text-muted-foreground">
          Test loading listings from your connected Etsy shop.
        </p>
      </div>

      <Button
        onClick={handleLoadListings}
        disabled={isLoading}
      >
        {isLoading ? "Loading Etsy listings..." : "Load Live Etsy Listings"}
      </Button>

      {error && (
        <p className="text-sm text-destructive">
          {error}
        </p>
      )}

      {listings.length > 0 && (
        <div className="space-y-2">
          <p className="font-medium">
            {shopName}
          </p>

          <p className="text-sm text-muted-foreground">
            Loaded {listings.length} active listings
          </p>

          <div className="flex items-center gap-3">
            {listings[0]?.imageUrls[0] && (
              <img
                src={listings[0].imageUrls[0]}
                alt={listings[0].title}
                className="h-16 w-16 rounded-md object-cover"
              />
            )}

            <span className="line-clamp-2 text-sm">
              {listings[0]?.title}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}