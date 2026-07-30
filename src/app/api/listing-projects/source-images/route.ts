import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  deleteListingProjectImagesByKind,
  saveListingProjectImage,
} from "@/lib/listing-projects/listingProjectImages";
import { supabaseAdmin } from "@/lib/supabase/server";

const MAX_SOURCE_IMAGES = 3;
const MAX_IMAGE_SIZE_BYTES =
  10 * 1024 * 1024;

const allowedImageTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

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

function isValidUuid(
  value: string,
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function POST(
  request: NextRequest,
) {
  try {
    const etsyUserId =
      getEtsyUserId(request);

    if (!etsyUserId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Connect your Etsy shop before saving listing images.",
        },
        {
          status: 401,
        },
      );
    }

    const formData =
      await request.formData();

    const projectIdValue =
      formData.get("projectId");

    const projectId =
      typeof projectIdValue === "string"
        ? projectIdValue.trim()
        : "";

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

    const sourceImages =
      formData
        .getAll("sourceImages")
        .filter(
          (value): value is File =>
            value instanceof File,
        );

    if (
      sourceImages.length >
      MAX_SOURCE_IMAGES
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You can upload up to 3 original product photos.",
        },
        {
          status: 400,
        },
      );
    }

    for (const image of sourceImages) {
      if (
        !allowedImageTypes.has(
          image.type,
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Only PNG, JPG, JPEG, and WebP images are supported.",
          },
          {
            status: 400,
          },
        );
      }

      if (
        image.size >
        MAX_IMAGE_SIZE_BYTES
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Each product photo must be 10 MB or smaller.",
          },
          {
            status: 400,
          },
        );
      }
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

    await deleteListingProjectImagesByKind({
      projectId,
      etsyUserId,
      imageKind: "source",
    });

    const savedImages = [];

    for (
      let index = 0;
      index < sourceImages.length;
      index += 1
    ) {
      const sourceImage =
        sourceImages[index];

      const savedImage =
        await saveListingProjectImage({
          projectId,
          etsyUserId,
          imageKind: "source",
          imageRank: index + 1,
          file: sourceImage,
          originalFilename:
            sourceImage.name,
          generationStatus:
            "complete",
        });

      savedImages.push({
        id: savedImage.id,
        imageKind:
          savedImage.image_kind,
        imageRank:
          savedImage.image_rank,
        storagePath:
          savedImage.storage_path,
        mimeType:
          savedImage.mime_type,
        originalFilename:
          savedImage.original_filename,
      });
    }

    return NextResponse.json({
      success: true,
      projectId,
      images: savedImages,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The original product photos could not be saved.";

    console.error(
      "Source image upload failed:",
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