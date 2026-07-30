import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";

const DEFAULT_MONTHLY_IMAGE_LIMIT = 5;

export type ImageUsageResult = {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  billingMonth: string;
};

type ImageUsageRpcRow = {
  allowed: boolean;
  generation_count: number;
  monthly_limit: number;
  remaining: number;
};

type ImageRefundRpcRow = {
  refunded: boolean;
  generation_count: number;
  monthly_limit: number;
  remaining: number;
};

type ImageUsageDatabaseRow = {
  generation_count: number;
  monthly_limit: number;
};

function getCurrentBillingMonth() {
  const now = new Date();

  const year = now.getUTCFullYear();

  const month = String(
    now.getUTCMonth() + 1,
  ).padStart(2, "0");

  return `${year}-${month}`;
}

function cleanEtsyUserId(
  etsyUserId: string,
) {
  const cleanedUserId =
    etsyUserId.trim();

  if (!cleanedUserId) {
    throw new Error(
      "An Etsy user ID is required to check image credits.",
    );
  }

  return cleanedUserId;
}

export async function getImageUsage(
  etsyUserId: string,
): Promise<ImageUsageResult> {
  const cleanedUserId =
    cleanEtsyUserId(etsyUserId);

  const billingMonth =
    getCurrentBillingMonth();

  const { data, error } =
    await supabaseAdmin
      .from("ai_image_usage")
      .select(
        "generation_count, monthly_limit",
      )
      .eq(
        "etsy_user_id",
        cleanedUserId,
      )
      .eq(
        "billing_month",
        billingMonth,
      )
      .maybeSingle<ImageUsageDatabaseRow>();

  if (error) {
    console.error(
      "Image usage lookup failed:",
      error,
    );

    throw new Error(
      "Image-generation credits could not be loaded.",
    );
  }

  const used =
    data?.generation_count ?? 0;

  const limit =
    data?.monthly_limit ??
    DEFAULT_MONTHLY_IMAGE_LIMIT;

  const remaining = Math.max(
    limit - used,
    0,
  );

  return {
    allowed: remaining > 0,
    used,
    limit,
    remaining,
    billingMonth,
  };
}

export async function consumeImageCredit(
  etsyUserId: string,
): Promise<ImageUsageResult> {
  const cleanedUserId =
    cleanEtsyUserId(etsyUserId);

  const billingMonth =
    getCurrentBillingMonth();

  const { data, error } =
    await supabaseAdmin.rpc(
      "consume_ai_image_credit",
      {
        p_etsy_user_id: cleanedUserId,
        p_billing_month: billingMonth,
        p_default_monthly_limit:
          DEFAULT_MONTHLY_IMAGE_LIMIT,
      },
    );

  if (error) {
    console.error(
      "Image credit check failed:",
      error,
    );

    throw new Error(
      "Image-generation credits could not be checked.",
    );
  }

  const row = Array.isArray(data)
    ? (data[0] as
        | ImageUsageRpcRow
        | undefined)
    : undefined;

  if (!row) {
    throw new Error(
      "No image-credit result was returned.",
    );
  }

  return {
    allowed: row.allowed,
    used: row.generation_count,
    limit: row.monthly_limit,
    remaining: row.remaining,
    billingMonth,
  };
}

export async function refundImageCredit(
  etsyUserId: string,
  billingMonth: string,
): Promise<ImageUsageResult> {
  const cleanedUserId =
    cleanEtsyUserId(etsyUserId);

  const cleanedBillingMonth =
    billingMonth.trim();

  if (!cleanedBillingMonth) {
    throw new Error(
      "A billing month is required to refund an image credit.",
    );
  }

  const { data, error } =
    await supabaseAdmin.rpc(
      "refund_ai_image_credit",
      {
        p_etsy_user_id: cleanedUserId,
        p_billing_month:
          cleanedBillingMonth,
      },
    );

  if (error) {
    console.error(
      "Image credit refund failed:",
      error,
    );

    throw new Error(
      "The image-generation credit could not be refunded.",
    );
  }

  const row = Array.isArray(data)
    ? (data[0] as
        | ImageRefundRpcRow
        | undefined)
    : undefined;

  if (!row) {
    throw new Error(
      "No image-credit refund result was returned.",
    );
  }

  return {
    allowed: row.remaining > 0,
    used: row.generation_count,
    limit: row.monthly_limit,
    remaining: row.remaining,
    billingMonth:
      cleanedBillingMonth,
  };
}