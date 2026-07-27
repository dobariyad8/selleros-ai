"use client";

import {
  ExternalLink,
  Package,
  Tag,
} from "lucide-react";

import type { SellerOsListing } from "@/lib/etsy/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";


type Props = {
  listing: SellerOsListing;
};


export default function ListingPreviewCard({
  listing,
}: Props) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
        <CardTitle className="text-base sm:text-lg">
          Listing Preview
        </CardTitle>

        <CardDescription>
          Current Etsy listing information.
        </CardDescription>
      </CardHeader>


      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">

        <div className="flex min-w-0 flex-col gap-5 sm:flex-row">

          {listing.imageUrls?.length > 0 ? (
            <img
              src={listing.imageUrls[0]}
              alt={listing.title}
              className="h-48 w-full rounded-xl object-cover sm:w-48"
            />
          ) : (
            <div className="flex h-48 w-full items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground sm:w-48">
              No image
            </div>
          )}


          <div className="min-w-0 flex-1">

            <h3 className="line-clamp-2 text-lg font-semibold">
              {listing.title}
            </h3>


            <div className="mt-3 flex flex-wrap gap-2">

              <Badge>
                {listing.currencyCode}{" "}
                {listing.price.toFixed(2)}
              </Badge>


              <Badge variant="outline">
                <Package className="mr-1 size-3" />
                {listing.quantity} available
              </Badge>


              <Badge variant="outline">
                {listing.status}
              </Badge>

            </div>


            {listing.tags.length > 0 && (
              <div className="mt-4">

                <p className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <Tag className="size-3" />
                  Tags
                </p>


                <div className="flex flex-wrap gap-2">
                  {listing.tags.slice(0, 6).map(
                    (tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                      >
                        {tag}
                      </Badge>
                    ),
                  )}
                </div>

              </div>
            )}


            {listing.listingUrl && (
              <Button
                className="mt-5 w-full sm:w-auto"
                variant="outline"
                nativeButton={false}
                render={
                  <a
                    href={listing.listingUrl}
                    target="_blank"
                    rel="noreferrer"
                  />
                }
              >
                View on Etsy
                <ExternalLink className="size-4" />
              </Button>
            )}

          </div>

        </div>

      </CardContent>
    </Card>
  );
}