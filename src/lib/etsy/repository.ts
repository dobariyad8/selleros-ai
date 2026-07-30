import { EtsyClient } from "./client";
import {
  mapImageUrls,
  mapListing,
} from "./mapper";
import { mapWithConcurrency } from "./rateLimiter";
import type {
  EtsyImagesResponse,
  EtsyListingsResponse,
  EtsyListingsResult,
  EtsyShopResponse,
  SellerOsListing,
} from "./types";

const ETSY_API_BASE_URL =
  "https://openapi.etsy.com/v3/application";

type EtsyRepositoryOptions = {
  apiKey: string;
  sharedSecret: string;
  accessToken: string;
};

export type CreateEtsyDraftListingInput = {
  shopId: number;
  quantity: number;
  title: string;
  description: string;
  price: string;
  taxonomyId: number;
  shippingProfileId: number;
  readinessStateId: number;
  itemWeight: number;
  itemWeightUnit:
    | "oz"
    | "lb"
    | "g"
    | "kg";
  itemLength: number;
  itemWidth: number;
  itemHeight: number;
  itemDimensionsUnit:
    | "in"
    | "ft"
    | "mm"
    | "cm"
    | "m"
    | "yd"
    | "inches";
  whoMade:
    | "i_did"
    | "collective"
    | "someone_else";
  whenMade: string;
  isSupply: boolean;
  tags?: string[];
  materials?: string[];
  shouldAutoRenew?: boolean;
};

export type EtsyDraftListingResult = {
  listing_id: number;
  shop_id?: number;
  title?: string;
  description?: string;
  state?: string;
  quantity?: number;
  price?: {
    amount?: number;
    divisor?: number;
    currency_code?: string;
  };
  url?: string;
};

export type UploadEtsyListingImageInput = {
  shopId: number;
  listingId: number;
  image: File;
  rank: number;
  altText?: string;
  overwrite?: boolean;
  isWatermarked?: boolean;
};

export type EtsyListingImageResult = {
  listing_id: number;
  listing_image_id: number;
  rank?: number;
  url_75x75?: string;
  url_170x135?: string;
  url_570xN?: string;
  url_fullxfull?: string;
  full_height?: number;
  full_width?: number;
  alt_text?: string;
};

export type EtsyShippingProfile = {
  shipping_profile_id: number;
  title: string;
  origin_country_iso?: string;
  min_processing_days?: number;
  max_processing_days?: number;
};

type EtsyShippingProfilesResponse = {
  count?: number;
  results?: EtsyShippingProfile[];
};

export type EtsyReadinessState = {
  shop_id: number;
  readiness_state_id: number;
  readiness_state:
    | "ready_to_ship"
    | "made_to_order";
  min_processing_days?: number;
  max_processing_days?: number;
  processing_days_display_label?: string;
};

type EtsyReadinessStatesResponse = {
  count?: number;
  results?: EtsyReadinessState[];
};

export type EtsyTaxonomyNode = {
  id: number;
  level: number;
  name: string;
  parent_id: number | null;
  full_path_taxonomy_ids?: number[];
  children?: EtsyTaxonomyNode[];
};

type EtsyTaxonomyResponse = {
  count?: number;
  results?: EtsyTaxonomyNode[];
};

export class EtsyRepository {
  private readonly client: EtsyClient;
  private readonly accessToken: string;

  constructor(
    options: EtsyRepositoryOptions,
  ) {
    this.client =
      new EtsyClient({
        apiKey:
          options.apiKey,
        sharedSecret:
          options.sharedSecret,
        accessToken:
          options.accessToken,
      });

    this.accessToken =
      options.accessToken;
  }

  /**
   * Etsy currently prefixes the OAuth access token with the user ID.
   */
  private getUserId(): string {
    const userId =
      this.accessToken
        .split(".")[0]
        ?.trim();

    if (!userId) {
      throw new Error(
        "Could not determine the Etsy user ID from the access token.",
      );
    }

    return userId;
  }

  /**
   * Retrieves the shop connected to the authenticated Etsy user.
   */
  async getShop(): Promise<{
    shopId: number;
    shopName: string;
  }> {
    const userId =
      this.getUserId();

    const shop =
      await this.client.get<EtsyShopResponse>(
        `${ETSY_API_BASE_URL}/users/${userId}/shops`,
      );

    if (!shop.shop_id) {
      throw new Error(
        shop.error ??
          "Could not retrieve the connected Etsy shop.",
      );
    }

    return {
      shopId:
        shop.shop_id,
      shopName:
        shop.shop_name ??
        "Connected Etsy Shop",
    };
  }

  /**
 * Retrieves the shipping profiles available in the connected shop.
 */
async getShippingProfiles(
  shopId: number,
): Promise<EtsyShippingProfile[]> {
  const response =
    await this.client.get<EtsyShippingProfilesResponse>(
      `${ETSY_API_BASE_URL}/shops/${shopId}/shipping-profiles`,
    );

  return Array.isArray(response.results)
    ? response.results
    : [];
}

/**
 * Retrieves processing/readiness profiles available in the shop.
 */
async getReadinessStates(
  shopId: number,
): Promise<EtsyReadinessState[]> {
  const results: EtsyReadinessState[] = [];
  const limit = 100;
  let offset = 0;

  while (true) {
    const url = new URL(
      `${ETSY_API_BASE_URL}/shops/${shopId}/readiness-state-definitions`,
    );

    url.searchParams.set(
      "limit",
      String(limit),
    );

    url.searchParams.set(
      "offset",
      String(offset),
    );

    const response =
      await this.client.get<EtsyReadinessStatesResponse>(
        url.toString(),
      );

    const page = Array.isArray(
      response.results,
    )
      ? response.results
      : [];

    results.push(...page);

    if (
      page.length === 0 ||
      page.length < limit ||
      results.length >=
        (response.count ?? results.length)
    ) {
      break;
    }

    offset += page.length;
  }

  return results;
}

/**
 * Retrieves Etsy's complete seller-category hierarchy.
 */
async getSellerTaxonomy(): Promise<EtsyTaxonomyNode[]> {
  const response =
    await this.client.get<EtsyTaxonomyResponse>(
      `${ETSY_API_BASE_URL}/seller-taxonomy/nodes`,
    );

  return Array.isArray(response.results)
    ? response.results
    : [];
}

  /**
   * Creates an unpublished physical Etsy listing.
   */
  async createDraftListing(
    input: CreateEtsyDraftListingInput,
  ): Promise<EtsyDraftListingResult> {
    if (
      !Number.isInteger(
        input.shopId,
      ) ||
      input.shopId < 1
    ) {
      throw new Error(
        "A valid Etsy shop ID is required.",
      );
    }

    if (
      !Number.isInteger(
        input.quantity,
      ) ||
      input.quantity < 1
    ) {
      throw new Error(
        "Etsy listing quantity must be at least 1.",
      );
    }

    if (
      !Number.isInteger(
        input.taxonomyId,
      ) ||
      input.taxonomyId < 1
    ) {
      throw new Error(
        "A valid Etsy taxonomy ID is required.",
      );
    }

    if (
      !Number.isInteger(
        input.shippingProfileId,
      ) ||
      input.shippingProfileId < 1
    ) {
      throw new Error(
        "A valid Etsy shipping profile is required.",
      );
    }

    if (
      !Number.isInteger(
        input.readinessStateId,
      ) ||
      input.readinessStateId < 1
    ) {
      throw new Error(
        "A valid Etsy readiness state is required.",
      );
    }

    const packageMeasurements = [
      {
        name: "Item weight",
        value: input.itemWeight,
      },
      {
        name: "Item length",
        value: input.itemLength,
      },
      {
        name: "Item width",
        value: input.itemWidth,
      },
      {
        name: "Item height",
        value: input.itemHeight,
      },
    ];

    for (const measurement of packageMeasurements) {
      if (
        !Number.isFinite(
          measurement.value,
        ) ||
        measurement.value <= 0
      ) {
        throw new Error(
          `${measurement.name} must be greater than 0.`,
        );
      }
    }

    const title =
      input.title.trim();

    const description =
      input.description.trim();

    const price =
      input.price.trim();

    if (!title) {
      throw new Error(
        "An Etsy listing title is required.",
      );
    }

    if (!description) {
      throw new Error(
        "An Etsy listing description is required.",
      );
    }

    if (!price) {
      throw new Error(
        "An Etsy listing price is required.",
      );
    }

    const body =
      new URLSearchParams();

    body.append(
      "quantity",
      String(input.quantity),
    );

    body.append(
      "title",
      title,
    );

    body.append(
      "description",
      description,
    );

    body.append(
      "price",
      price,
    );

    body.append(
      "who_made",
      input.whoMade,
    );

    body.append(
      "when_made",
      input.whenMade,
    );

    body.append(
      "taxonomy_id",
      String(input.taxonomyId),
    );

    body.append(
      "shipping_profile_id",
      String(
        input.shippingProfileId,
      ),
    );

    body.append(
      "readiness_state_id",
      String(
        input.readinessStateId,
      ),
    );

    body.append(
      "item_weight",
      String(input.itemWeight),
    );
    
    body.append(
      "item_weight_unit",
      input.itemWeightUnit,
    );
    
    body.append(
      "item_length",
      String(input.itemLength),
    );
    
    body.append(
      "item_width",
      String(input.itemWidth),
    );
    
    body.append(
      "item_height",
      String(input.itemHeight),
    );
    
    body.append(
      "item_dimensions_unit",
      input.itemDimensionsUnit,
    );

    body.append(
      "is_supply",
      String(input.isSupply),
    );

    body.append(
      "should_auto_renew",
      String(
        input.shouldAutoRenew ??
          false,
      ),
    );

    const tags = (input.tags ?? [])
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (tags.length > 0) {
      body.append(
        "tags",
        tags.join(","),
      );
    }

    const materials = (input.materials ?? [])
      .map((material) =>
        material.trim(),
      )
      .filter(Boolean);
    
    if (materials.length > 0) {
      body.append(
        "materials",
        materials.join(","),
      );
    }

    return this.client.postForm<EtsyDraftListingResult>(
      `${ETSY_API_BASE_URL}/shops/${input.shopId}/listings?legacy=false`,
      body,
    );
  }

  /**
   * Uploads one image to an Etsy listing.
   */
  async uploadListingImage(
    input: UploadEtsyListingImageInput,
  ): Promise<EtsyListingImageResult> {
    if (
      !Number.isInteger(
        input.shopId,
      ) ||
      input.shopId < 1
    ) {
      throw new Error(
        "A valid Etsy shop ID is required.",
      );
    }

    if (
      !Number.isInteger(
        input.listingId,
      ) ||
      input.listingId < 1
    ) {
      throw new Error(
        "A valid Etsy listing ID is required.",
      );
    }

    if (
      !Number.isInteger(
        input.rank,
      ) ||
      input.rank < 1
    ) {
      throw new Error(
        "The Etsy image rank must be at least 1.",
      );
    }

    if (
      !input.image.type.startsWith(
        "image/",
      )
    ) {
      throw new Error(
        "The Etsy listing upload must be an image.",
      );
    }

    const body =
      new FormData();

    body.append(
      "image",
      input.image,
      input.image.name,
    );

    body.append(
      "rank",
      String(input.rank),
    );

    body.append(
      "overwrite",
      String(
        input.overwrite ??
          false,
      ),
    );

    body.append(
      "is_watermarked",
      String(
        input.isWatermarked ??
          false,
      ),
    );

    const altText =
      input.altText
        ?.trim()
        .slice(0, 500);

    if (altText) {
      body.append(
        "alt_text",
        altText,
      );
    }

    return this.client.postMultipart<EtsyListingImageResult>(
      `${ETSY_API_BASE_URL}/shops/${input.shopId}/listings/${input.listingId}/images`,
      body,
    );
  }

  /**
   * Retrieves the image URLs for one Etsy listing.
   */
  async getListingImageUrls(
    listingId: number,
  ): Promise<string[]> {
    try {
      const response =
        await this.client.get<EtsyImagesResponse>(
          `${ETSY_API_BASE_URL}/listings/${listingId}/images`,
        );

      return mapImageUrls(
        response.results ?? [],
      );
    } catch (error) {
      console.error(
        `Could not retrieve images for Etsy listing ${listingId}:`,
        error,
      );

      return [];
    }
  }

  /**
   * Retrieves one page of active Etsy listings.
   */
  private async getActiveListingsPage(
    shopId: number,
    limit: number,
    offset: number,
  ): Promise<EtsyListingsResponse> {
    const url =
      new URL(
        `${ETSY_API_BASE_URL}/shops/${shopId}/listings/active`,
      );

    url.searchParams.set(
      "limit",
      String(limit),
    );

    url.searchParams.set(
      "offset",
      String(offset),
    );

    return this.client.get<EtsyListingsResponse>(
      url.toString(),
    );
  }

  /**
   * Retrieves active listings and converts them into SellerOS listings.
   */
  async getActiveListings(): Promise<EtsyListingsResult> {
    const shop =
      await this.getShop();

    const pageSize = 100;
    let offset = 0;
    let totalAvailable = 0;

    const rawListings: EtsyListingsResponse["results"] =
      [];

    do {
      const page =
        await this.getActiveListingsPage(
          shop.shopId,
          pageSize,
          offset,
        );

      const pageListings =
        Array.isArray(
          page.results,
        )
          ? page.results
          : [];

      rawListings.push(
        ...pageListings,
      );

      totalAvailable =
        page.count ??
        rawListings.length;

      offset +=
        pageListings.length;

      if (
        pageListings.length ===
          0 ||
        pageListings.length <
          pageSize
      ) {
        break;
      }
    } while (
      rawListings.length <
      totalAvailable
    );

    const listings =
      await mapWithConcurrency(
        rawListings,
        3,
        async (
          listing,
        ): Promise<SellerOsListing> => {
          const imageUrls =
            await this.getListingImageUrls(
              listing.listing_id,
            );

          return mapListing(
            listing,
            imageUrls,
          );
        },
      );

    return {
      shop,
      count:
        listings.length,
      totalAvailable,
      listings,
    };
  }
}