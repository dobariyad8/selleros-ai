import { EtsyClient } from "./client";
import { mapImageUrls, mapListing } from "./mapper";
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

export class EtsyRepository {
  private readonly client: EtsyClient;
  private readonly accessToken: string;

  constructor(options: EtsyRepositoryOptions) {
    this.client = new EtsyClient({
      apiKey: options.apiKey,
      sharedSecret: options.sharedSecret,
      accessToken: options.accessToken,
    });

    this.accessToken = options.accessToken;
  }

  /**
   * Etsy currently prefixes the OAuth access token with the user ID.
   *
   * We are keeping this logic inside the repository so that API routes
   * and UI components do not need to know about Etsy's token format.
   */
  private getUserId(): string {
    const userId = this.accessToken.split(".")[0];

    if (!userId) {
      throw new Error(
        "Could not determine the Etsy user ID from the access token."
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
    const userId = this.getUserId();

    const shop = await this.client.get<EtsyShopResponse>(
      `${ETSY_API_BASE_URL}/users/${userId}/shops`
    );

    if (!shop.shop_id) {
      throw new Error(
        shop.error ?? "Could not retrieve the connected Etsy shop."
      );
    }

    return {
      shopId: shop.shop_id,
      shopName: shop.shop_name ?? "Connected Etsy Shop",
    };
  }

  /**
   * Retrieves the image URLs for one Etsy listing.
   */
  async getListingImageUrls(
    listingId: number
  ): Promise<string[]> {
    try {
      const response =
        await this.client.get<EtsyImagesResponse>(
          `${ETSY_API_BASE_URL}/listings/${listingId}/images`
        );

      return mapImageUrls(response.results ?? []);
    } catch (error) {
      console.error(
        `Could not retrieve images for Etsy listing ${listingId}:`,
        error
      );

      /*
       * A failed image request should not prevent all listings from
       * loading. The listing will simply have an empty image array.
       */
      return [];
    }
  }

  /**
   * Retrieves one page of active Etsy listings.
   */
  private async getActiveListingsPage(
    shopId: number,
    limit: number,
    offset: number
  ): Promise<EtsyListingsResponse> {
    const url = new URL(
      `${ETSY_API_BASE_URL}/shops/${shopId}/listings/active`
    );

    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(offset));

    return this.client.get<EtsyListingsResponse>(
      url.toString()
    );
  }

  /**
   * Retrieves active listings and converts them into SellerOS listings.
   *
   * Etsy supports up to 100 listings per page. We use pagination so this
   * method will continue working even when the shop grows beyond 100
   * active listings.
   */
  async getActiveListings(): Promise<EtsyListingsResult> {
    const shop = await this.getShop();

    const pageSize = 100;
    let offset = 0;
    let totalAvailable = 0;

    const rawListings: EtsyListingsResponse["results"] = [];

    do {
      const page = await this.getActiveListingsPage(
        shop.shopId,
        pageSize,
        offset
      );

      const pageListings = Array.isArray(page.results)
        ? page.results
        : [];

      rawListings.push(...pageListings);

      totalAvailable = page.count ?? rawListings.length;
      offset += pageListings.length;

      /*
       * Stop if Etsy returned no listings or fewer than the page size.
       * This protects us from an accidental infinite loop.
       */
      if (
        pageListings.length === 0 ||
        pageListings.length < pageSize
      ) {
        break;
      }
    } while (rawListings.length < totalAvailable);

    /*
     * Etsy rate limits image requests, so we only process three
     * listings simultaneously.
     *
     * EtsyClient automatically retries 429 responses.
     */
    const listings = await mapWithConcurrency(
      rawListings,
      3,
      async (listing): Promise<SellerOsListing> => {
        const imageUrls = await this.getListingImageUrls(
          listing.listing_id
        );

        return mapListing(listing, imageUrls);
      }
    );

    return {
      shop,
      count: listings.length,
      totalAvailable,
      listings,
    };
  }
}