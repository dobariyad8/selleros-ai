export type LiveEtsyListing = {
  id: string;
  listingId: number;
  title: string;
  description: string;
  price: number;
  currencyCode: string;
  quantity: number;
  tags: string[];
  materials: string[];
  imageUrls: string[];
  status: string;
  taxonomyId: number | null;
  listingUrl: string | null;
  source: "etsy-api";
};

export type EtsyShopSummary = {
  shopId: number;
  shopName: string;
};

export type EtsyListingsApiResponse = {
  success: boolean;
  shop?: EtsyShopSummary;
  count?: number;
  totalAvailable?: number;
  listings?: LiveEtsyListing[];
  error?: string;
};