import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  requireProSubscription,
  SubscriptionAccessError,
} from "@/lib/billing/requireProSubscription";
import {
  deleteListingProject,
} from "@/lib/listing-projects/deleteListingProject";
import {
  supabaseAdmin,
} from "@/lib/supabase/server";
import {
  EtsyAccessError,
} from "@/lib/etsy/createRepository";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    historyId: string;
  }>;
};

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
      "Export cleanup Etsy connection lookup failed:",
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
    throw new EtsyAccessError(
      "Connect your Etsy shop before retrying project cleanup.",
      403,
      "ETSY_NOT_CONNECTED",
    );
  }

  return etsyUserId;
}

export async function POST(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const etsyUserId =
      await getOwnedEtsyUserId();

    const {
      historyId,
    } = await context.params;

    if (
      !historyId ||
      !isValidUuid(historyId)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A valid export history ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const {
      data: historyRecord,
      error: historyError,
    } = await supabaseAdmin
      .from(
        "etsy_export_history",
      )
      .select(
        `
          id,
          source_project_id,
          project_cleanup_completed
        `,
      )
      .eq(
        "id",
        historyId,
      )
      .eq(
        "etsy_user_id",
        etsyUserId,
      )
      .maybeSingle();

    if (historyError) {
      console.error(
        "Export history cleanup retry lookup failed:",
        historyError,
      );

      throw new Error(
        "The export history record could not be loaded.",
      );
    }

    if (!historyRecord) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The export history record was not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      historyRecord.project_cleanup_completed
    ) {
      return NextResponse.json({
        success: true,
        historyId,
        cleanupCompleted: true,
        projectAlreadyMissing: true,
        deletedStorageFileCount: 0,
      });
    }

    const sourceProjectId =
      historyRecord.source_project_id;

    if (
      !sourceProjectId ||
      !isValidUuid(sourceProjectId)
    ) {
      throw new Error(
        "This export history record does not contain a valid source project ID.",
      );
    }

    try {
      const cleanupResult =
        await deleteListingProject({
          projectId:
            sourceProjectId,
          etsyUserId,
          allowMissing: true,
        });

      const {
        error: historyUpdateError,
      } = await supabaseAdmin
        .from(
          "etsy_export_history",
        )
        .update({
          project_cleanup_completed:
            true,
          project_cleanup_error:
            null,
        })
        .eq(
          "id",
          historyId,
        )
        .eq(
          "etsy_user_id",
          etsyUserId,
        );

      if (historyUpdateError) {
        console.error(
          "Export history cleanup completion update failed:",
          historyUpdateError,
        );

        throw new Error(
          "The project was cleaned up, but the export history record could not be updated.",
        );
      }

      return NextResponse.json({
        success: true,
        historyId,
        cleanupCompleted: true,
        projectAlreadyMissing:
          cleanupResult.projectAlreadyMissing,
        deletedStorageFileCount:
          cleanupResult.deletedStorageFileCount,
      });
    } catch (cleanupError) {
      const cleanupMessage =
        cleanupError instanceof Error
          ? cleanupError.message
          : "The SellerOS project cleanup failed.";

      const {
        error:
          cleanupErrorSaveError,
      } = await supabaseAdmin
        .from(
          "etsy_export_history",
        )
        .update({
          project_cleanup_completed:
            false,
          project_cleanup_error:
            cleanupMessage,
        })
        .eq(
          "id",
          historyId,
        )
        .eq(
          "etsy_user_id",
          etsyUserId,
        );

      if (
        cleanupErrorSaveError
      ) {
        console.error(
          "Export history cleanup failure update failed:",
          cleanupErrorSaveError,
        );
      }

      throw cleanupError;
    }
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

    if (error instanceof EtsyAccessError) {
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
        : "The SellerOS project cleanup could not be retried.";

    console.error(
      "Export history cleanup retry failed:",
      error,
    );

    const status =
      message.includes(
        "not found",
      )
        ? 404
        : message.includes(
              "valid",
            ) ||
            message.includes(
              "does not contain",
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