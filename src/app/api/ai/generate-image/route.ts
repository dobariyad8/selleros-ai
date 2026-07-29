import {
  NextRequest,
  NextResponse,
} from "next/server";

import { consumeImageCredit } from "@/lib/ai/imageUsage";
import {
  generateEtsyImage,
  type GenerateEtsyImageInput,
} from "@/lib/ai/generateEtsyImage";
import type { EtsyImageStyle } from "@/lib/ai/prompts";

type GenerateImageRequest = {
  listing?: unknown;
  style?: unknown;
  customInstructions?: unknown;
};

const validStyles: EtsyImageStyle[] = [
  "studio",
  "lifestyle",
  "gift",
  "seasonal",
  "thumbnail",
];

function isValidStyle(
  value: unknown,
): value is EtsyImageStyle {
  return (
    typeof value === "string" &&
    validStyles.includes(
      value as EtsyImageStyle,
    )
  );
}

function isValidListing(
  value: unknown,
): value is GenerateEtsyImageInput["listing"] {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const listing = value as Record<
    string,
    unknown
  >;

  return (
    typeof listing.title === "string" &&
    typeof listing.description ===
      "string" &&
    Array.isArray(listing.tags) &&
    listing.tags.every(
      (tag) => typeof tag === "string",
    ) &&
    Array.isArray(listing.imageUrls) &&
    listing.imageUrls.every(
      (url) => typeof url === "string",
    )
  );
}

function getEtsyUserId(
  request: NextRequest,
) {
  const accessToken =
    request.cookies.get(
      "etsy_access_token",
    )?.value;

  if (!accessToken) {
    return null;
  }

  const userId =
    accessToken.split(".")[0]?.trim();

  return userId || null;
}

export async function POST(
  request: NextRequest,
) {
  try {
    const body =
      (await request.json()) as GenerateImageRequest;

    if (!isValidListing(body.listing)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A valid listing with at least one image is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!isValidStyle(body.style)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A valid image style is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      body.customInstructions !==
        undefined &&
      typeof body.customInstructions !==
        "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Custom instructions must be text.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      body.listing.imageUrls.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "At least one source image is required.",
        },
        {
          status: 400,
        },
      );
    }

    const etsyUserId =
      getEtsyUserId(request);

    if (!etsyUserId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Connect your Etsy shop before generating images.",
        },
        {
          status: 401,
        },
      );
    }

    const usage =
      await consumeImageCredit(
        etsyUserId,
      );

    if (!usage.allowed) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You have reached your monthly AI image-generation limit.",
          usage: {
            used: usage.used,
            limit: usage.limit,
            remaining:
              usage.remaining,
            billingMonth:
              usage.billingMonth,
          },
        },
        {
          status: 429,
        },
      );
    }

    const generatedImage =
      await generateEtsyImage({
        listing: body.listing,
        style: body.style,
        customInstructions:
          typeof body.customInstructions ===
          "string"
            ? body.customInstructions
            : "",
      });

    return NextResponse.json({
      success: true,
      generatedImage,
      usage: {
        used: usage.used,
        limit: usage.limit,
        remaining:
          usage.remaining,
        billingMonth:
          usage.billingMonth,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The Etsy image could not be generated.";

    console.error(
      "Etsy image generation failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status: 500,
      },
    );
  }
}