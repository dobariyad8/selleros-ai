import {
  EtsyApiListing,
  EtsyImage,
  SellerOsListing,
} from "./types";

export function formatPrice(amount: number, divisor: number): number {
  if (!divisor) {
    return 0;
  }

  return amount / divisor;
}

export function getBestImageUrl(
  image: EtsyImage
): string | null {
  return (
    image.url_fullxfull ??
    image.url_570xN ??
    image.url_170x135 ??
    image.url_75x75 ??
    null
  );
}

export function mapImageUrls(
  images: EtsyImage[]
): string[] {
  return images
    .map(getBestImageUrl)
    .filter(
      (url): url is string => Boolean(url)
    );
}

export function mapListing(
  listing: EtsyApiListing,
  imageUrls: string[]
): SellerOsListing {
  return {
    id: String(listing.listing_id),

    listingId: listing.listing_id,

    title: listing.title ?? "",

    description: listing.description ?? "",

    price: formatPrice(
      listing.price.amount,
      listing.price.divisor
    ),

    currencyCode:
      listing.price.currency_code,

    quantity: listing.quantity ?? 0,

    tags: listing.tags ?? [],

    materials:
      listing.materials ?? [],

    imageUrls,

    status: listing.state,

    taxonomyId:
      listing.taxonomy_id ?? null,

    listingUrl:
      listing.url ?? null,

    source: "etsy-api",
  };
}