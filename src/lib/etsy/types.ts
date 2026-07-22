export type EtsyMoney = {
  amount: number;
  divisor: number;
  currency_code: string;
};

export type EtsyImage = {
  listing_image_id: number;
  url_75x75?: string | null;
  url_170x135?: string | null;
  url_570xN?: string | null;
  url_fullxfull?: string | null;
};

export type EtsyApiListing = {
  listing_id: number;
  title: string;
  description: string;
  state: string;
  quantity: number;
  price: EtsyMoney;
  tags?: string[];
  materials?: string[];
  taxonomy_id?: number | null;
  url?: string | null;
};

export type EtsyShopResponse = {
  shop_id?: number;
  shop_name?: string;
  error?: string;
};

export type EtsyListingsResponse = {
  count: number;
  results: EtsyApiListing[];
  error?: string;
};

export type EtsyImagesResponse = {
  count?: number;
  results?: EtsyImage[];
  error?: string;
};

export type SellerOsListing = {
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

export type EtsyListingsResult = {
  shop: EtsyShopSummary;
  count: number;
  totalAvailable: number;
  listings: SellerOsListing[];
};