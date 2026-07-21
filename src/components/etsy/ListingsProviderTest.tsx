"use client";

import { useListings } from "@/hooks/useListings";

export function ListingsProviderTest() {
  const {
    listings,
    shop,
    count,
    totalAvailable,
    isLoading,
    isRefreshing,
    error,
    refreshListings,
  } = useListings();

  if (isLoading) {
    return (
      <div className="rounded-lg border p-6">
        Loading Etsy listings...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 p-6">
        <p className="font-medium text-red-600">
          Could not load listings
        </p>

        <p className="mt-2 text-sm text-muted-foreground">
          {error}
        </p>

        <button
          type="button"
          onClick={() => void refreshListings()}
          className="mt-4 rounded-md border px-4 py-2 text-sm"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">
            {shop?.shopName ?? "Etsy Shop"}
          </h2>

          <p className="text-sm text-muted-foreground">
            Loaded {count} of {totalAvailable} listings
          </p>
        </div>

        <button
          type="button"
          disabled={isRefreshing}
          onClick={() => void refreshListings()}
          className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
        >
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="mt-6 space-y-2">
        {listings.slice(0, 5).map((listing) => (
          <div
            key={listing.id}
            className="rounded-md bg-muted p-3"
          >
            <p className="font-medium">
              {listing.title}
            </p>

            <p className="text-sm text-muted-foreground">
              {listing.currencyCode}{" "}
              {listing.price.toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}