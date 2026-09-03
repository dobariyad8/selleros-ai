import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/auth-server";
import { supabaseAdmin } from "@/lib/supabase/server";

type SubscriptionRecord = {
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  plan_key: string;
  subscription_status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  cancel_at: string | null;
  canceled_at: string | null;
};

export async function GET() {
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
            "Log in before viewing your subscription.",
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
      .select(
        `
          stripe_customer_id,
          stripe_subscription_id,
          stripe_price_id,
          plan_key,
          subscription_status,
          current_period_start,
          current_period_end,
          cancel_at_period_end,
          cancel_at,
          canceled_at
        `,
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error(
        "Subscription status load failed:",
        error,
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

    const subscription =
      data as SubscriptionRecord | null;

    if (!subscription) {
      return NextResponse.json({
        success: true,
        subscription: {
          planKey: "early_access",
          status: "early_access",
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          stripePriceId: null,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          cancelAt: null,
          canceledAt: null,
          canStartCheckout: true,
          canManageBilling: false,
        },
      });
    }

    const existingSubscriptionStatuses =
      new Set([
        "incomplete",
        "active",
        "trialing",
        "past_due",
        "unpaid",
        "paused",
      ]);

    return NextResponse.json({
      success: true,
      subscription: {
        planKey: subscription.plan_key,
        status:
          subscription.subscription_status,

        stripeCustomerId:
          subscription.stripe_customer_id,

        stripeSubscriptionId:
          subscription.stripe_subscription_id,

        stripePriceId:
          subscription.stripe_price_id,

        currentPeriodStart:
          subscription.current_period_start,

        currentPeriodEnd:
          subscription.current_period_end,

        cancelAtPeriodEnd:
          subscription.cancel_at_period_end,

        cancelAt:
          subscription.cancel_at,

        canceledAt:
          subscription.canceled_at,

        canStartCheckout:
          !subscription.stripe_subscription_id ||
          !existingSubscriptionStatuses.has(
            subscription.subscription_status,
          ),

        canManageBilling:
          Boolean(
            subscription.stripe_customer_id,
          ),
      },
    });
  } catch (error) {
    console.error(
      "Subscription API failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not load subscription information.",
      },
      {
        status: 500,
      },
    );
  }
}