import type {
  EtsyListingsApiResponse,
  LiveEtsyListing,
} from "./live-listing-types";

export type FetchLiveListingsResult = {
  listings: LiveEtsyListing[];
  shopName: string;
  totalAvailable: number;
};

export async function fetchLiveEtsyListings(): Promise<FetchLiveListingsResult> {
  const response = await fetch("/api/etsy/listings", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const data = (await response.json()) as EtsyListingsApiResponse;

  if (!response.ok || !data.success) {
    throw new Error(data.error ?? "Could not retrieve Etsy listings.");
  }

  return {
    listings: data.listings ?? [],
    shopName: data.shop?.shopName ?? "Connected Etsy Shop",
    totalAvailable: data.totalAvailable ?? data.listings?.length ?? 0,
  };
}