import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/auth-server";
import { supabaseAdmin } from "@/lib/supabase/server";

type SubscriptionRecord = {
  plan_key: string;
  subscription_status: string;
};

export class SubscriptionAccessError extends Error {
  status: number;
  code: "UNAUTHENTICATED" | "PRO_REQUIRED";

  constructor(
    message: string,
    status: number,
    code: "UNAUTHENTICATED" | "PRO_REQUIRED",
  ) {
    super(message);

    this.name = "SubscriptionAccessError";
    this.status = status;
    this.code = code;
  }
}

export async function requireProSubscription() {
  const supabase =
    await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new SubscriptionAccessError(
      "Log in to SellerOS before using this feature.",
      401,
      "UNAUTHENTICATED",
    );
  }

  const {
    data,
    error,
  } = await supabaseAdmin
    .from("selleros_subscriptions")
    .select(
      `
        plan_key,
        subscription_status
      `,
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error(
      "Subscription access check failed:",
      error,
    );

    throw new Error(
      "SellerOS could not verify your subscription.",
    );
  }

  const subscription =
    data as SubscriptionRecord | null;

  const hasProAccess =
    subscription?.plan_key === "pro" &&
    ["active", "trialing"].includes(
      subscription.subscription_status,
    );

  if (!hasProAccess) {
    throw new SubscriptionAccessError(
      "SellerOS Pro is required to use this feature.",
      403,
      "PRO_REQUIRED",
    );
  }

  return {
    user,
    subscription,
  };
}