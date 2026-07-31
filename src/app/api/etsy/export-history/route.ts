import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabase/server";

export const runtime = "nodejs";

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
            "Connect your Etsy shop before loading export history.",
        },
        {
          status: 401,
        },
      );
    }

    const {
      data: history,
      error: historyError,
    } = await supabaseAdmin
      .from(
        "etsy_export_history",
      )
      .select(
        `
          id,
          source_project_id,
          etsy_shop_id,
          etsy_shop_name,
          etsy_listing_id,
          listing_title,
          listing_url,
          uploaded_image_count,
          etsy_state,
          project_cleanup_completed,
          project_cleanup_error,
          exported_at
        `,
      )
      .eq(
        "etsy_user_id",
        etsyUserId,
      )
      .order(
        "exported_at",
        {
          ascending: false,
        },
      );

    if (historyError) {
      console.error(
        "Etsy export history load failed:",
        historyError,
      );

      throw new Error(
        "The Etsy export history could not be loaded.",
      );
    }

    const exports =
      (history ?? []).map(
        (record) => ({
          id:
            record.id,
          sourceProjectId:
            record.source_project_id,
          shopId:
            record.etsy_shop_id,
          shopName:
            record.etsy_shop_name,
          listingId:
            record.etsy_listing_id,
          listingTitle:
            record.listing_title,
          listingUrl:
            record.listing_url,
          uploadedImageCount:
            record.uploaded_image_count,
          state:
            record.etsy_state,
          projectCleanupCompleted:
            record.project_cleanup_completed,
          projectCleanupError:
            record.project_cleanup_error,
          exportedAt:
            record.exported_at,
        }),
      );

    return NextResponse.json({
      success: true,
      exports,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The Etsy export history could not be loaded.";

    console.error(
      "Etsy export history retrieval failed:",
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