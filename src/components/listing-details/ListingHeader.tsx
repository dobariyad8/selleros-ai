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
    <div className="min-w-0">
      <Link
        href="/listings"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4 shrink-0" />
        Back to listings
      </Link>

      <div className="mt-4 min-w-0 sm:mt-5">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="wrap-break-words text-2xl font-bold tracking-tight sm:text-3xl">
              {listing.title}
            </h1>

            <p className="mt-2 wrap-break-words text-sm text-muted-foreground sm:text-base">
              {listing.category}
            </p>
          </div>

          <Badge
            variant={
              listing.status === "Active"
                ? "default"
                : listing.status === "Draft"
                  ? "secondary"
                  : "destructive"
            }
            className="w-fit shrink-0"
          >
            {listing.status}
          </Badge>
        </div>
      </div>
    </div>
  );
}