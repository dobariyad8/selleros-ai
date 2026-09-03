import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  requireProSubscription,
  SubscriptionAccessError,
} from "@/lib/billing/requireProSubscription";
import { supabaseAdmin } from "@/lib/supabase/server";

const LISTING_IMAGE_BUCKET =
  "listing-project-images";

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
      "Listing project delete Etsy connection lookup failed:",
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
      "Connect your Etsy shop before deleting a listing project.",
    );
  }

  return etsyUserId;
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const etsyUserId =
      await getOwnedEtsyUserId();

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
        : "The listing project could not be deleted.";

    console.error(
      "Listing project delete request failed:",
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
          : message.includes(
                "valid",
              ) ||
              message.includes(
                "required",
              )
            ? 400
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