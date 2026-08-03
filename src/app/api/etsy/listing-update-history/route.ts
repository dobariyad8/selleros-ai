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
            "Connect your Etsy shop before loading listing update history.",
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
        "etsy_listing_update_history",
      )
      .select(
        `
          id,
          etsy_shop_id,
          etsy_shop_name,
          etsy_listing_id,
          listing_title,
          updated_title,
          updated_description,
          updated_tags,
          previous_title,
          new_title,
          previous_description,
          new_description,
          previous_tags,
          new_tags,
          update_status,
          error_message,
          updated_at
        `,
      )
      .eq(
        "etsy_user_id",
        etsyUserId,
      )
      .order(
        "updated_at",
        {
          ascending: false,
        },
      );

    if (historyError) {
      console.error(
        "Etsy listing update history load failed:",
        historyError,
      );

      throw new Error(
        "The Etsy listing update history could not be loaded.",
      );
    }

    const updates =
      (history ?? []).map(
        (record) => ({
          id:
            record.id,

          shopId:
            record.etsy_shop_id,
          shopName:
            record.etsy_shop_name,

          listingId:
            record.etsy_listing_id,
          listingTitle:
            record.listing_title,

          updatedFields: {
            title:
              record.updated_title,
            description:
              record.updated_description,
            tags:
              record.updated_tags,
          },

          previousValues: {
            title:
              record.previous_title,
            description:
              record.previous_description,
            tags:
              record.previous_tags ??
              [],
          },

          newValues: {
            title:
              record.new_title,
            description:
              record.new_description,
            tags:
              record.new_tags ??
              [],
          },

          status:
            record.update_status,
          error:
            record.error_message,
          updatedAt:
            record.updated_at,
        }),
      );

    return NextResponse.json({
      success: true,
      count:
        updates.length,
      updates,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The Etsy listing update history could not be loaded.";

    console.error(
      "Etsy listing update history retrieval failed:",
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