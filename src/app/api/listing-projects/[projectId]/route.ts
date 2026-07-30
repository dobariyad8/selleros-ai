import {
  NextRequest,
  NextResponse,
} from "next/server";

import { supabaseAdmin } from "@/lib/supabase/server";

const LISTING_IMAGE_BUCKET =
  "listing-project-images";

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

type RouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const etsyUserId =
      getEtsyUserId(request);

    if (!etsyUserId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Connect your Etsy shop before deleting a listing project.",
        },
        {
          status: 401,
        },
      );
    }

    const { projectId: rawProjectId } =
      await context.params;

    const projectId =
      rawProjectId.trim();

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
      .select("storage_path")
      .eq(
        "project_id",
        projectId,
      )
      .eq(
        "etsy_user_id",
        etsyUserId,
      );

    if (imagesError) {
      console.error(
        "Listing project images lookup failed:",
        imagesError,
      );

      throw new Error(
        "The listing project images could not be loaded.",
      );
    }

    const storagePaths =
      (imageRecords ?? [])
        .map(
          (image) =>
            image.storage_path,
        )
        .filter(
          (
            storagePath,
          ): storagePath is string =>
            typeof storagePath ===
              "string" &&
            storagePath.length > 0,
        );

    if (storagePaths.length > 0) {
      const {
        error: storageDeleteError,
      } = await supabaseAdmin.storage
        .from(
          LISTING_IMAGE_BUCKET,
        )
        .remove(storagePaths);

      if (storageDeleteError) {
        console.error(
          "Listing project Storage deletion failed:",
          storageDeleteError,
        );

        throw new Error(
          "The listing project image files could not be deleted.",
        );
      }
    }

    const {
      error: projectDeleteError,
    } = await supabaseAdmin
      .from("listing_projects")
      .delete()
      .eq(
        "id",
        projectId,
      )
      .eq(
        "etsy_user_id",
        etsyUserId,
      );

    if (projectDeleteError) {
      console.error(
        "Listing project deletion failed:",
        projectDeleteError,
      );

      throw new Error(
        "The listing project could not be deleted.",
      );
    }

    return NextResponse.json({
      success: true,
      projectId,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The listing project could not be deleted.";

    console.error(
      "Listing project delete request failed:",
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