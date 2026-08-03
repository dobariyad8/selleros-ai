import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  applyEtsyAuthCookies,
  type EtsyAuthSession,
} from "@/lib/etsy/auth";
import {
  EtsyApiError,
} from "@/lib/etsy/client";
import {
  createEtsyRepository,
} from "@/lib/etsy/createRepository";

export const runtime = "nodejs";

type UpdateListingContentRequest = {
  listingId?: unknown;

  updateTitle?: unknown;
  updateDescription?: unknown;
  updateTags?: unknown;

  title?: unknown;
  description?: unknown;
  tags?: unknown;
};

function readText(
  value: unknown,
) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function readPositiveInteger(
  value: unknown,
) {
  const parsedValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  return Number.isInteger(
    parsedValue,
  ) && parsedValue > 0
    ? parsedValue
    : null;
}

function readTags(
  value: unknown,
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (
        tag,
      ): tag is string =>
        typeof tag === "string",
    )
    .map((tag) =>
      tag.trim(),
    )
    .filter(Boolean);
}

export async function POST(
  request: NextRequest,
) {
  let authSession:
    | EtsyAuthSession
    | null = null;

  try {
    const body =
      (await request.json()) as UpdateListingContentRequest;

    const listingId =
      readPositiveInteger(
        body.listingId,
      );

    if (!listingId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A valid Etsy listing ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const updateTitle =
      body.updateTitle === true;

    const updateDescription =
      body.updateDescription ===
      true;

    const updateTags =
      body.updateTags === true;

    if (
      !updateTitle &&
      !updateDescription &&
      !updateTags
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Select at least one listing field to update.",
        },
        {
          status: 400,
        },
      );
    }

    const title =
      readText(body.title);

    const description =
      readText(
        body.description,
      );

    const tags =
      readTags(body.tags);

    if (
      updateTitle &&
      !title
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The recommended title cannot be empty.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      updateDescription &&
      !description
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The recommended description cannot be empty.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      updateTags &&
      tags.length < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Select at least one valid Etsy tag.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      updateTags &&
      tags.length > 13
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Etsy allows a maximum of 13 tags.",
        },
        {
          status: 400,
        },
      );
    }

    const {
      repository,
      authSession:
        repositoryAuthSession,
    } =
      await createEtsyRepository(
        request,
      );

    authSession =
      repositoryAuthSession;

    /*
     * Always derive the shop ID from the authenticated
     * Etsy account instead of trusting a browser value.
     */
    const shop =
      await repository.getShop();

    const updatedListing =
      await repository.updateListingContent({
        shopId:
          shop.shopId,
        listingId,
        title:
          updateTitle
            ? title
            : undefined,
        description:
          updateDescription
            ? description
            : undefined,
        tags:
          updateTags
            ? tags
            : undefined,
      });

    const response =
      NextResponse.json({
        success: true,
        listingId:
          updatedListing.listing_id,
        shopId:
          updatedListing.shop_id ??
          shop.shopId,
        shopName:
          shop.shopName,
        title:
          updatedListing.title ??
          (updateTitle
            ? title
            : null),
        description:
          updatedListing.description ??
          (updateDescription
            ? description
            : null),
        tags:
          updatedListing.tags ??
          (updateTags
            ? tags
            : null),
        state:
          updatedListing.state ??
          null,
        listingUrl:
          updatedListing.url ??
          null,
        updatedFields: {
          title:
            updateTitle,
          description:
            updateDescription,
          tags:
            updateTags,
        },
      });

    return applyEtsyAuthCookies(
      response,
      authSession,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The Etsy listing could not be updated.";

    console.error(
      "Etsy listing content update failed:",
      error,
    );

    const status =
      error instanceof EtsyApiError
        ? error.status
        : message.includes(
              "required",
            ) ||
              message.includes(
                "empty",
              ) ||
              message.includes(
                "Select",
              ) ||
              message.includes(
                "maximum",
              ) ||
              message.includes(
                "valid",
              )
          ? 400
          : message.includes(
                "Connect your Etsy shop",
              ) ||
              message.includes(
                "access token",
              ) ||
              message.includes(
                "connection has expired",
              )
            ? 401
            : 500;

    const response =
      NextResponse.json(
        {
          success: false,
          error: message,
          etsyStatus:
            error instanceof EtsyApiError
              ? error.status
              : undefined,
        },
        {
          status,
        },
      );

    return authSession
      ? applyEtsyAuthCookies(
          response,
          authSession,
        )
      : response;
  }
}