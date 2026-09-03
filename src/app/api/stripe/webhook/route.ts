import {
  NextRequest,
  NextResponse,
} from "next/server";
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
  customer:
    | string
    | Stripe.Customer
    | Stripe.DeletedCustomer,
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
      firstItem?.current_period_start ??
      null,

    currentPeriodEnd:
      firstItem?.current_period_end ??
      null,
  };
}

function getSellerOsUserId(
  subscription: Stripe.Subscription,
  fallbackUserId?: string | null,
) {
  return (
    subscription.metadata
      .selleros_user_id?.trim() ||
    fallbackUserId?.trim() ||
    null
  );
}

function getSubscriptionPriceId(
  subscription: Stripe.Subscription,
) {
  return (
    subscription.items.data[0]
      ?.price.id ?? null
  );
}

async function saveSubscription({
  subscription,
  eventId,
  eventCreated,
  fallbackUserId,
}: {
  subscription: Stripe.Subscription;
  eventId: string;
  eventCreated: number;
  fallbackUserId?: string | null;
}) {
  const sellerosUserId =
    getSellerOsUserId(
      subscription,
      fallbackUserId,
    );

  if (!sellerosUserId) {
    /*
     * This subscription does not belong to a
     * SellerOS account. Ignore it rather than
     * causing Stripe to retry an unrelated
     * subscription event.
     */
    console.warn(
      `Ignoring Stripe subscription ${subscription.id} because it does not contain a SellerOS user ID.`,
    );

    return;
  }

  const priceId =
    getSubscriptionPriceId(
      subscription,
    );

  if (
    priceId !==
    serverEnv.stripeProPriceId
  ) {
    throw new Error(
      `Stripe subscription ${subscription.id} uses an unsupported SellerOS price.`,
    );
  }

  /*
   * Check whether this exact event has already
   * been applied or whether a newer Stripe event
   * already produced the stored state.
   */
  const {
    data: existingData,
    error: existingError,
  } = await supabaseAdmin
    .from(
      "selleros_subscriptions",
    )
    .select(
      `
        last_stripe_event_created,
        last_stripe_event_id
      `,
    )
    .eq(
      "user_id",
      sellerosUserId,
    )
    .maybeSingle();

  if (existingError) {
    console.error(
      "Existing Stripe event lookup failed:",
      existingError,
    );

    throw new Error(
      "SellerOS could not verify the current Stripe subscription state.",
    );
  }

  const existingEventId =
    existingData
      ?.last_stripe_event_id ??
    null;

  const existingEventCreated =
    typeof existingData
      ?.last_stripe_event_created ===
    "number"
      ? existingData
          .last_stripe_event_created
      : null;

  if (
    existingEventId === eventId
  ) {
    /*
     * Stripe can deliver the same event more
     * than once. The event has already been
     * persisted successfully.
     */
    return;
  }

  if (
    existingEventCreated !== null &&
    existingEventCreated >
      eventCreated
  ) {
    /*
     * A newer Stripe event already produced
     * the stored subscription state.
     */
    return;
  }

  const {
    currentPeriodStart,
    currentPeriodEnd,
  } = getSubscriptionPeriod(
    subscription,
  );

  const now =
    new Date().toISOString();

  const {
    error,
  } = await supabaseAdmin
    .from(
      "selleros_subscriptions",
    )
    .upsert(
      {
        user_id:
          sellerosUserId,

        stripe_customer_id:
          getCustomerId(
            subscription.customer,
          ),

        stripe_subscription_id:
          subscription.id,

        stripe_price_id:
          priceId,

        /*
         * Pro access is derived from the
         * trusted Stripe price configured
         * on the SellerOS server, rather
         * than trusting Stripe metadata
         * to determine entitlement.
         */
        plan_key: "pro",

        subscription_status:
          subscription.status,

        current_period_start:
          unixToIso(
            currentPeriodStart,
          ),

        current_period_end:
          unixToIso(
            currentPeriodEnd,
          ),

        cancel_at_period_end:
          subscription
            .cancel_at_period_end,

        cancel_at:
          unixToIso(
            subscription.cancel_at,
          ),

        canceled_at:
          unixToIso(
            subscription.canceled_at,
          ),

        last_stripe_event_created:
          eventCreated,

        last_stripe_event_id:
          eventId,

        updated_at:
          now,
      },
      {
        onConflict:
          "user_id",
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

async function loadCurrentSubscription(
  subscriptionId: string,
) {
  /*
   * Webhook delivery order is not guaranteed.
   * Always retrieve the current Subscription
   * from Stripe rather than trusting an older
   * webhook payload as the latest state.
   */
  return stripe.subscriptions.retrieve(
    subscriptionId,
  );
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  event: Stripe.Event,
) {
  if (
    session.mode !==
      "subscription" ||
    !session.subscription
  ) {
    return;
  }

  const subscriptionId =
    typeof session.subscription ===
    "string"
      ? session.subscription
      : session.subscription.id;

  const subscription =
    await loadCurrentSubscription(
      subscriptionId,
    );

  await saveSubscription({
    subscription,
    eventId: event.id,
    eventCreated:
      event.created,
    fallbackUserId:
      session.client_reference_id ??
      session.metadata
        ?.selleros_user_id ??
      null,
  });
}

async function handleSubscriptionEvent(
  webhookSubscription:
    Stripe.Subscription,
  event: Stripe.Event,
) {
  /*
   * Fetch Stripe's current version of the
   * Subscription. This prevents a late
   * webhook payload from rolling SellerOS
   * back to stale subscription data.
   */
  const subscription =
    await loadCurrentSubscription(
      webhookSubscription.id,
    );

  await saveSubscription({
    subscription,
    eventId: event.id,
    eventCreated:
      event.created,
  });
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
    /*
     * Stripe webhook signature verification
     * requires the original raw request body.
     */
    const rawBody =
      await request.text();

    event =
      stripe.webhooks.constructEvent(
        rawBody,
        signature,
        serverEnv
          .stripeWebhookSecret,
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
          event,
        );

        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await handleSubscriptionEvent(
          event.data.object,
          event,
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