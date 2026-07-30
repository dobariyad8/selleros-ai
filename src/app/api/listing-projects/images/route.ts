import {
  NextRequest,
  NextResponse,
} from "next/server";

import { getListingProjectImageSignedUrl } from "@/lib/listing-projects/listingProjectImages";
import { supabaseAdmin } from "@/lib/supabase/server";

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

export async function GET(
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
            "Connect your Etsy shop before loading listing images.",
        },
        {
          status: 401,
        },
      );
    }

    const projectId =
      request.nextUrl.searchParams
        .get("projectId")
        ?.trim() ?? "";

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

    const {
      data: imageRecords,
      error: imagesError,
    } = await supabaseAdmin
      .from("listing_project_images")
      .select("*")
      .eq("project_id", projectId)
      .eq(
        "etsy_user_id",
        etsyUserId,
      )
      .order("image_rank", {
        ascending: true,
      });

    if (imagesError) {
      console.error(
        "Listing project images load failed:",
        imagesError,
      );

      throw new Error(
        "The listing project images could not be loaded.",
      );
    }

    const images = await Promise.all(
      (imageRecords ?? []).map(
        async (image) => {
          const signedUrl =
            image.storage_path
              ? await getListingProjectImageSignedUrl(
                  image.storage_path,
                )
              : null;

          return {
            id: image.id,
            projectId:
              image.project_id,
            imageKind:
              image.image_kind,
            imageRank:
              image.image_rank,
            storagePath:
              image.storage_path,
            signedUrl,
            mimeType:
              image.mime_type,
            originalFilename:
              image.original_filename,
            conceptTitle:
              image.concept_title,
            conceptDescription:
              image.concept_description,
            generationInstructions:
              image.generation_instructions,
            promptUsed:
              image.prompt_used,
            altText:
              image.alt_text,
            generationStatus:
              image.generation_status,
            errorMessage:
              image.error_message,
            createdAt:
              image.created_at,
            updatedAt:
              image.updated_at,
          };
        },
      ),
    );

    return NextResponse.json({
      success: true,
      projectId,
      images,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The listing project images could not be loaded.";

    console.error(
      "Listing project image retrieval failed:",
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