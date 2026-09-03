import {
  NextRequest,
  NextResponse,
} from "next/server";

import { serverEnv } from "@/lib/env/server";
import { createSupabaseServerClient } from "@/lib/supabase/auth-server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/server";

type SubscriptionRecord = {
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string;
};

export async function POST(
  _request: NextRequest,
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
            "Log in before starting a subscription.",
        },
        {
          status: 401,
        },
      );
    }

    if (!user.email) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Your SellerOS account does not have an email address.",
        },
        {
          status: 400,
        },
      );
    }

    const {
      data: subscriptionData,
      error: subscriptionError,
    } = await supabaseAdmin
      .from("selleros_subscriptions")
      .select(
        `
          stripe_customer_id,
          stripe_subscription_id,
          subscription_status
        `,
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (subscriptionError) {
      console.error(
        "Subscription lookup failed:",
        subscriptionError,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "SellerOS could not load your subscription.",
        },
        {
          status: 500,
        },
      );
    }

    const existingSubscription =
      subscriptionData as SubscriptionRecord | null;

    const existingSubscriptionStatuses =
  new Set([
    "incomplete",
    "active",
    "trialing",
    "past_due",
    "unpaid",
    "paused",
  ]);

    if (
      existingSubscription?.stripe_subscription_id &&
      existingSubscriptionStatuses.has(
        existingSubscription.subscription_status,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You already have a Stripe subscription. Use Manage Billing instead.",
        },
        {
          status: 409,
        },
      );
    }

    const appUrl =
  serverEnv.appUrl.replace(
    /\/+$/,
    "",
  );

    const checkoutSession =
      await stripe.checkout.sessions.create({
        mode: "subscription",

        line_items: [
          {
            price:
              serverEnv.stripeProPriceId,
            quantity: 1,
          },
        ],

        success_url:
          `${appUrl}/subscription?checkout=success&session_id={CHECKOUT_SESSION_ID}`,

        cancel_url:
          `${appUrl}/subscription?checkout=cancelled`,

        client_reference_id: user.id,

        customer:
          existingSubscription?.stripe_customer_id ??
          undefined,

        customer_email:
          existingSubscription?.stripe_customer_id
            ? undefined
            : user.email,

        metadata: {
          selleros_user_id: user.id,
        },

        subscription_data: {
          metadata: {
            selleros_user_id: user.id,
            selleros_plan_key: "pro",
          },
        },

        allow_promotion_codes: true,
      });

    if (!checkoutSession.url) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Stripe did not return a Checkout URL.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      success: true,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error(
      "Stripe Checkout creation failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not start Stripe Checkout.",
      },
      {
        status: 500,
      },
    );
  }
}