import {
  NextResponse,
} from "next/server";

import {
  requireProSubscription,
  SubscriptionAccessError,
} from "@/lib/billing/requireProSubscription";
import {
  supabaseAdmin,
} from "@/lib/supabase/server";
import {
  EtsyAccessError,
} from "@/lib/etsy/createRepository";

export const runtime = "nodejs";

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
      "Listing update history Etsy connection lookup failed:",
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
      "Connect your Etsy shop before loading listing update history.",
      403,
      "ETSY_NOT_CONNECTED",
    );
  }

  return etsyUserId;
}

export async function GET() {
  try {
    const etsyUserId =
      await getOwnedEtsyUserId();

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