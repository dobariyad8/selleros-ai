import { NextResponse } from "next/server";

import { getImageUsage } from "@/lib/ai/imageUsage";
import {
  requireProSubscription,
  SubscriptionAccessError,
} from "@/lib/billing/requireProSubscription";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  try {
    const { user } =
      await requireProSubscription();

    const {
      data: connection,
      error: connectionError,
    } = await supabaseAdmin
      .from("etsy_connections")
      .select("etsy_user_id")
      .eq("user_id", user.id)
      .eq("connection_status", "active")
      .maybeSingle();

    if (connectionError) {
      console.error(
        "Etsy connection lookup failed:",
        connectionError,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "SellerOS could not load your Etsy connection.",
        },
        {
          status: 500,
        },
      );
    }

    const etsyUserId =
      typeof connection?.etsy_user_id ===
      "string"
        ? connection.etsy_user_id.trim()
        : "";

    if (!etsyUserId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Connect your Etsy shop to view image credits.",
        },
        {
          status: 403,
        },
      );
    }

    const usage =
      await getImageUsage(etsyUserId);

    return NextResponse.json({
      success: true,
      usage: {
        used: usage.used,
        limit: usage.limit,
        remaining: usage.remaining,
        billingMonth:
          usage.billingMonth,
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
        : "Image-generation credits could not be loaded.";

    console.error(
      "Image usage request failed:",
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