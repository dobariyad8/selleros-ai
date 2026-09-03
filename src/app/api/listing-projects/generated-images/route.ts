import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  requireProSubscription,
  SubscriptionAccessError,
} from "@/lib/billing/requireProSubscription";
import {
  saveListingProjectImage,
  type ListingProjectImageKind,
} from "@/lib/listing-projects/listingProjectImages";
import { supabaseAdmin } from "@/lib/supabase/server";

const MAX_IMAGE_SIZE_BYTES =
  10 * 1024 * 1024;

const allowedImageTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

const allowedImageKinds =
  new Set<ListingProjectImageKind>([
    "studio",
    "lifestyle",
    "detail",
    "scale",
    "gift",
    "seasonal",
  ]);

function readText(
  value: FormDataEntryValue | null,
) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function isValidUuid(
  value: string,
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function getOwnedEtsyUserId() {
  const { user } =
    await requireProSubscription();

  const {
    data: connection,
    error: connectionError,
  } = await supabaseAdmin
    .from("etsy_connections")
    .select("etsy_user_id")
    .eq("user_id", user.id)
    .eq(
      "connection_status",
      "active",
    )
    .maybeSingle();

  if (connectionError) {
    console.error(
      "Generated image Etsy connection lookup failed:",
      connectionError,
    );

    throw new Error(
      "SellerOS could not load your Etsy connection.",
    );
  }

  const etsyUserId =
    typeof connection?.etsy_user_id ===
    "string"
      ? connection.etsy_user_id.trim()
      : "";

  if (!etsyUserId) {
    throw new Error(
      "Connect your Etsy shop before saving generated images.",
    );
  }

  return etsyUserId;
}

export async function POST(
  request: NextRequest,
) {
  try {
    const etsyUserId =
      await getOwnedEtsyUserId();

    const formData =
      await request.formData();

    const projectId =
      readText(
        formData.get("projectId"),
      );

    const imageKind =
      readText(
        formData.get("imageKind"),
      ) as ListingProjectImageKind;

    const imageRankText =
      readText(
        formData.get("imageRank"),
      );

    const conceptTitle =
      readText(
        formData.get("conceptTitle"),
      );

    const conceptDescription =
      readText(
        formData.get(
          "conceptDescription",
        ),
      );

    const generationInstructions =
      readText(
        formData.get(
          "generationInstructions",
        ),
      );

    const promptUsed =
      readText(
        formData.get("promptUsed"),
      );

    const altText =
      readText(
        formData.get("altText"),
      );

    const generatedImageValue =
      formData.get("generatedImage");

    if (
      !projectId ||
      !isValidUuid(projectId)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A valid listing project ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !allowedImageKinds.has(
        imageKind,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The generated image type is invalid.",
        },
        {
          status: 400,
        },
      );
    }

    const imageRank =
      Number(imageRankText);

    if (
      !Number.isInteger(imageRank) ||
      imageRank < 1 ||
      imageRank > 6
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The generated image rank must be between 1 and 6.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !(generatedImageValue instanceof File)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A generated image file is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !allowedImageTypes.has(
        generatedImageValue.type,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only PNG, JPG, JPEG, and WebP generated images are supported.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      generatedImageValue.size >
      MAX_IMAGE_SIZE_BYTES
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The generated image must be 10 MB or smaller.",
        },
        {
          status: 400,
        },
      );
    }

    const {
      data: project,
      error: projectError,
    } = await supabaseAdmin
      .from("listing_projects")
      .select("id")
      .eq("id", projectId)
      .eq(
        "etsy_user_id",
        etsyUserId,
      )
      .maybeSingle();

    if (projectError) {
      console.error(
        "Listing project ownership check failed:",
        projectError,
      );

      throw new Error(
        "The listing project could not be verified.",
      );
    }

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The listing project was not found.",
        },
        {
          status: 404,
        },
      );
    }

    const savedImage =
      await saveListingProjectImage({
        projectId,
        etsyUserId,
        imageKind,
        imageRank,
        file: generatedImageValue,
        originalFilename:
          generatedImageValue.name,
        conceptTitle,
        conceptDescription,
        generationInstructions,
        promptUsed,
        altText,
        generationStatus:
          "complete",
      });

    return NextResponse.json({
      success: true,
      image: {
        id: savedImage.id,
        projectId:
          savedImage.project_id,
        imageKind:
          savedImage.image_kind,
        imageRank:
          savedImage.image_rank,
        storagePath:
          savedImage.storage_path,
        mimeType:
          savedImage.mime_type,
        generationStatus:
          savedImage.generation_status,
      },
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
        : "The generated listing image could not be saved.";

    console.error(
      "Generated listing image save failed:",
      error,
    );

    const status =
      message.includes(
        "Connect your Etsy shop",
      )
        ? 403
        : message.includes(
              "not found",
            )
          ? 404
          : 500;

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status,
      },
    );
  }
}