import { NextResponse } from "next/server";

import {
  generateListingImage,
  type ListingImageType,
} from "@/lib/ai/generateListingImage";
import {
  consumeImageCredit,
  refundImageCredit,
  type ImageUsageResult,
} from "@/lib/ai/imageUsage";
import {
  requireProSubscription,
  SubscriptionAccessError,
} from "@/lib/billing/requireProSubscription";
import { supabaseAdmin } from "@/lib/supabase/server";

const validImageTypes =
  new Set<ListingImageType>([
    "studio",
    "lifestyle",
    "detail",
    "scale",
    "gift",
    "seasonal",
  ]);

function readFormText(
  formData: FormData,
  name: string,
) {
  const value = formData.get(name);

  return typeof value === "string"
    ? value.trim()
    : "";
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
            "Connect your Etsy shop before generating listing images.",
        },
        {
          status: 403,
        },
      );
    }

    const formData =
      await request.formData();

    const sourceImage =
      formData.get("sourceImage");

    const productTitle =
      readFormText(
        formData,
        "productTitle",
      );

    const productDescription =
      readFormText(
        formData,
        "productDescription",
      );

    const imageTypeValue =
      readFormText(
        formData,
        "imageType",
      );

    const conceptTitle =
      readFormText(
        formData,
        "conceptTitle",
      );

    const conceptDescription =
      readFormText(
        formData,
        "conceptDescription",
      );

    const generationInstructions =
      readFormText(
        formData,
        "generationInstructions",
      );

    if (!(sourceImage instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A source product image is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !sourceImage.type.startsWith(
        "image/",
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The uploaded source file must be an image.",
        },
        {
          status: 400,
        },
      );
    }

    if (!productTitle) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A product title is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !validImageTypes.has(
        imageTypeValue as ListingImageType,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A valid listing image type is required.",
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
      await generateListingImage({
        sourceImage,
        productTitle,
        productDescription,
        imageType:
          imageTypeValue as ListingImageType,
        conceptTitle,
        conceptDescription,
        generationInstructions,
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
        : "The listing image could not be generated.";

    console.error(
      "Listing image generation failed:",
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
          "Listing image credit refund failed:",
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