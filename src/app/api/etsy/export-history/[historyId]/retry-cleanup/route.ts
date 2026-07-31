import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  deleteListingProject,
} from "@/lib/listing-projects/deleteListingProject";
import {
  supabaseAdmin,
} from "@/lib/supabase/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    historyId: string;
  }>;
};

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
    accessToken
      .split(".")[0]
      ?.trim();

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
            "Connect your Etsy shop before retrying project cleanup.",
        },
        {
          status: 401,
        },
      );
    }

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
        cleanupCompleted:
          true,
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
    const message =
      error instanceof Error
        ? error.message
        : "The SellerOS project cleanup could not be retried.";

    console.error(
      "Export history cleanup retry failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status:
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
              : 500,
      },
    );
  }
}