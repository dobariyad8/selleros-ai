import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import { serverEnv } from "@/lib/env/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/server";

function unixToIso(
  timestamp: number | null | undefined,
) {
  if (!timestamp) {
    return null;
  }

  return new Date(
    timestamp * 1000,
  ).toISOString();
}

function getCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer,
) {
  return typeof customer === "string"
    ? customer
    : customer.id;
}

function getSubscriptionPeriod(
  subscription: Stripe.Subscription,
) {
  const firstItem =
    subscription.items.data[0];

  return {
    currentPeriodStart:
      firstItem?.current_period_start ?? null,

    currentPeriodEnd:
      firstItem?.current_period_end ?? null,
  };
}

async function saveSubscription(
  subscription: Stripe.Subscription,
  fallbackUserId?: string | null,
) {
  const sellerosUserId =
    subscription.metadata.selleros_user_id?.trim() ||
    fallbackUserId?.trim();

  if (!sellerosUserId) {
    throw new Error(
      `Stripe subscription ${subscription.id} does not contain a SellerOS user ID.`,
    );
  }

  const priceId =
    subscription.items.data[0]?.price.id ?? null;

  const {
    currentPeriodStart,
    currentPeriodEnd,
  } = getSubscriptionPeriod(subscription);

  const now =
    new Date().toISOString();

  const {
    error,
  } = await supabaseAdmin
    .from("selleros_subscriptions")
    .upsert(
      {
        user_id: sellerosUserId,

        stripe_customer_id:
          getCustomerId(
            subscription.customer,
          ),

        stripe_subscription_id:
          subscription.id,

        stripe_price_id:
          priceId,

        plan_key:
          subscription.metadata
            .selleros_plan_key?.trim() ||
          "pro",

        subscription_status:
          subscription.status,

        current_period_start:
          unixToIso(currentPeriodStart),

        current_period_end:
          unixToIso(currentPeriodEnd),

        cancel_at_period_end:
          subscription.cancel_at_period_end,

        cancel_at:
          unixToIso(
            subscription.cancel_at,
          ),

        canceled_at:
          unixToIso(
            subscription.canceled_at,
          ),

        updated_at: now,
      },
      {
        onConflict: "user_id",
      },
    );

  if (error) {
    console.error(
      "Stripe subscription save failed:",
      error,
    );

    throw new Error(
      "SellerOS could not save the Stripe subscription.",
    );
  }
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
) {
  if (
    session.mode !== "subscription" ||
    !session.subscription
  ) {
    return;
  }

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription.id;

  const subscription =
    await stripe.subscriptions.retrieve(
      subscriptionId,
    );

  await saveSubscription(
    subscription,
    session.client_reference_id ??
      session.metadata?.selleros_user_id ??
      null,
  );
}

export async function POST(
  request: NextRequest,
) {
  const signature =
    request.headers.get(
      "stripe-signature",
    );

  if (!signature) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Missing Stripe signature.",
      },
      {
        status: 400,
      },
    );
  }

  let event: Stripe.Event;

  try {
    const rawBody =
      await request.text();

    event =
      stripe.webhooks.constructEvent(
        rawBody,
        signature,
        serverEnv.stripeWebhookSecret,
      );
  } catch (error) {
    console.error(
      "Stripe webhook verification failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Invalid Stripe webhook signature.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutCompleted(
          event.data.object,
        );
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await saveSubscription(
          event.data.object,
        );
        break;
      }

      default:
        break;
    }

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error(
      `Stripe webhook handling failed for ${event.type}:`,
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Stripe webhook processing failed.",
      },
      {
        status: 500,
      },
    );
  }
}