import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  consumeImageCredit,
  refundImageCredit,
  type ImageUsageResult,
} from "@/lib/ai/imageUsage";
import {
  generateListingImage,
  type ListingImageType,
} from "@/lib/ai/generateListingImage";

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
  request: NextRequest,
) {
  let etsyUserId: string | null = null;

  let consumedUsage:
    | ImageUsageResult
    | null = null;

  try {
    etsyUserId = getEtsyUserId(request);

    if (!etsyUserId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Connect your Etsy shop before generating listing images.",
        },
        {
          status: 401,
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