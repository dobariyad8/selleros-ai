"use client";

import Link from "next/link";
import { ArrowLeft, FileWarning } from "lucide-react";

import ListingHeader from "@/components/listing-details/ListingHeader";
import ListingOptimizerWorkspace from "@/components/listing-details/ListingOptimizerWorkspace";
import { Button } from "@/components/ui/button";
import { useListings } from "@/hooks/useListings";

import type { Listing } from "@/data/listings-data";
import type { SellerOsListing } from "@/lib/etsy/types";

type ListingDetailsClientProps = {
  id: string;
};

function convertSellerOsListingToListing(
  listing: SellerOsListing,
): Listing {
  const title =
    listing.title?.trim() || "Untitled listing";

  const price = Number(listing.price ?? 0);

  return {
    id: listing.id,
    title,

    // SellerOsListing does not currently provide
    // category or performance statistics.
    category: "Uncategorized",
    price,
    views: 0,
    orders: 0,

    // Temporary score until this older details workspace
    // is connected to the new scoring engines.
    score: 60,

    status:
      listing.status === "Active"
        ? "Active"
        : listing.status === "Draft"
          ? "Draft"
          : "Needs Attention",

    description: listing.description ?? "",
    tags: listing.tags ?? [],

    currentTitle: title,

    // Temporary suggestion used by the older workspace.
    suggestedTitle: `${title} | Handmade Etsy Gift`,

    // Temporary pricing recommendation.
    recommendedPrice: Number(
      (price * 1.1).toFixed(2),
    ),

    imageUrl:
      listing.imageUrls?.[0] ??
      "/placeholder-product.jpg",

    imageIssue:
      "Review the image brightness, crop, background, and product visibility.",
  };
}

export default function ListingDetailsClient({
  id,
}: ListingDetailsClientProps) {
  const { listings, isLoading, error } =
    useListings();

  const importedListing = listings.find(
    (item) => String(item.id) === String(id),
  );

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-125 w-full max-w-3xl items-center justify-center">
        <div className="w-full rounded-xl border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Loading listing…
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-125 w-full max-w-3xl items-center justify-center">
        <div className="w-full rounded-xl border border-red-200 bg-red-50 p-10 text-center">
          <FileWarning className="mx-auto size-10 text-red-600" />

          <h1 className="mt-4 text-xl font-semibold text-red-700">
            Could not load listing
          </h1>

          <p className="mt-2 text-sm text-red-600">
            {error}
          </p>

          <Button
            className="mt-5"
            nativeButton={false}
            render={<Link href="/listings" />}
          >
            <ArrowLeft className="size-4" />
            Back to listings
          </Button>
        </div>
      </div>
    );
  }

  if (!importedListing) {
    return (
      <div className="mx-auto flex min-h-125 w-full max-w-3xl items-center justify-center">
        <div className="w-full rounded-xl border border-dashed p-10 text-center">
          <FileWarning className="mx-auto size-10 text-muted-foreground" />

          <h1 className="mt-4 text-xl font-semibold">
            Listing not available
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            The connected Etsy listing could not be
            found.
          </p>

          <Button
            className="mt-5"
            nativeButton={false}
            render={<Link href="/listings" />}
          >
            <ArrowLeft className="size-4" />
            Back to listings
          </Button>
        </div>
      </div>
    );
  }

  const listing =
    convertSellerOsListingToListing(
      importedListing,
    );

  return (
    <div className="mx-auto w-full max-w-7xl">
      <ListingHeader listing={listing} />

      <ListingOptimizerWorkspace
        listing={listing}
      />
    </div>
  );
}