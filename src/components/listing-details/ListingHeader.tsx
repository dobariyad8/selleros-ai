import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import type { Listing } from "@/data/listings-data";

type ListingHeaderProps = {
  listing: Listing;
};

export default function ListingHeader({
  listing,
}: ListingHeaderProps) {
  return (
    <>
      <Link
        href="/listings"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to listings
      </Link>

      <div className="mt-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {listing.title}
            </h1>

            <Badge
              variant={
                listing.status === "Active"
                  ? "default"
                  : listing.status === "Draft"
                    ? "secondary"
                    : "destructive"
              }
            >
              {listing.status}
            </Badge>
          </div>

          <p className="mt-2 text-muted-foreground">
            {listing.category}
          </p>
        </div>
      </div>
    </>
  );
}