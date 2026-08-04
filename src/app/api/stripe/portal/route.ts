import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/auth-server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/server";

type SubscriptionRecord = {
  stripe_customer_id: string | null;
};

export async function POST(
  request: NextRequest,
) {
  try {
    const supabase =
      await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Log in before managing billing.",
        },
        {
          status: 401,
        },
      );
    }

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("selleros_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error(
        "Stripe customer lookup failed:",
        error,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "SellerOS could not load your billing account.",
        },
        {
          status: 500,
        },
      );
    }

    const subscription =
      data as SubscriptionRecord | null;

    if (
      !subscription?.stripe_customer_id
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No Stripe billing account was found.",
        },
        {
          status: 404,
        },
      );
    }

    const origin =
      request.headers.get("origin") ??
      request.nextUrl.origin;

    const portalSession =
      await stripe.billingPortal.sessions.create({
        customer:
          subscription.stripe_customer_id,

        return_url:
          `${origin}/subscription`,
      });

    return NextResponse.json({
      success: true,
      url: portalSession.url,
    });
  } catch (error) {
    console.error(
      "Stripe portal creation failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not open the Stripe billing portal.",
      },
      {
        status: 500,
      },
    );
  }
}