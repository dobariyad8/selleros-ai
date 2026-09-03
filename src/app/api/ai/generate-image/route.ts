import { NextResponse } from "next/server";

import {
  generateEtsyImage,
  type GenerateEtsyImageInput,
} from "@/lib/ai/generateEtsyImage";
import {
  consumeImageCredit,
  refundImageCredit,
  type ImageUsageResult,
} from "@/lib/ai/imageUsage";
import type { EtsyImageStyle } from "@/lib/ai/prompts";
import {
  requireProSubscription,
  SubscriptionAccessError,
} from "@/lib/billing/requireProSubscription";
import { supabaseAdmin } from "@/lib/supabase/server";

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

function formatUsage(
  usage: ImageUsageResult,
) {
  return {
    used: usage.used,
    limit: usage.limit,
    remaining: usage.remaining,
    billingMonth: usage.billingMonth,
  };
}

export async function POST(
  request: Request,
) {
  let etsyUserId: string | null = null;

  let consumedUsage:
    | ImageUsageResult
    | null = null;

  try {
    const { user } =
      await requireProSubscription();

    const {
      data: connection,
      error: connectionError,
    } = await supabaseAdmin
      .from("etsy_connections")
      .select("etsy_user_id")
      .eq("user_id", user.id)
      .eq("connection_status", "active")
      .maybeSingle();

    if (connectionError) {
      console.error(
        "Etsy connection lookup failed:",
        connectionError,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "SellerOS could not load your Etsy connection.",
        },
        {
          status: 500,
        },
      );
    }

    etsyUserId =
      typeof connection?.etsy_user_id ===
      "string"
        ? connection.etsy_user_id.trim()
        : "";

    if (!etsyUserId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Connect your Etsy shop before generating images.",
        },
        {
          status: 403,
        },
      );
    }

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

    consumedUsage =
      await consumeImageCredit(
        etsyUserId,
      );

    if (!consumedUsage.allowed) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You have reached your monthly AI image-generation limit.",
          usage:
            formatUsage(consumedUsage),
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
      usage:
        formatUsage(consumedUsage),
    });
  } catch (error) {
    if (
      error instanceof
      SubscriptionAccessError
    ) {
      return NextResponse.json(
        {
          success: false,
          code: error.code,
          error: error.message,
        },
        {
          status: error.status,
        },
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "The Etsy image could not be generated.";

    console.error(
      "Etsy image generation failed:",
      error,
    );

    let refundedUsage:
      | ImageUsageResult
      | null = null;

    if (
      etsyUserId &&
      consumedUsage?.allowed
    ) {
      try {
        refundedUsage =
          await refundImageCredit(
            etsyUserId,
            consumedUsage.billingMonth,
          );
      } catch (refundError) {
        console.error(
          "Etsy image credit refund failed:",
          refundError,
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: message,
        creditRefunded:
          refundedUsage !== null,
        usage: refundedUsage
          ? formatUsage(refundedUsage)
          : consumedUsage
            ? formatUsage(consumedUsage)
            : undefined,
      },
      {
        status: 500,
      },
    );
  }
}