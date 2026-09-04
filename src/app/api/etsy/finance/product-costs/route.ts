import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  requireProSubscription,
  SubscriptionAccessError,
} from "@/lib/billing/requireProSubscription";

import {
  createEtsyRepository,
  EtsyAccessError,
} from "@/lib/etsy/createRepository";

import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ProductCostInput = {
  etsyListingId?: unknown;
  listingTitle?: unknown;

  materialCost?: unknown;
  packagingCost?: unknown;
  laborCost?: unknown;
  otherUnitCost?: unknown;

  currency?: unknown;
};

function readNumber(
  value: unknown,
) {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function readText(
  value: unknown,
) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

export async function GET(
  request: NextRequest,
) {
  try {
    const { user } =
      await requireProSubscription();

    const {
      repository,
    } = await createEtsyRepository(
      request,
    );

    const shop =
      await repository.getShop();

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("etsy_product_costs")
      .select(
        `
          id,
          etsy_shop_id,
          etsy_listing_id,
          listing_title,
          material_cost,
          packaging_cost,
          labor_cost,
          other_unit_cost,
          currency,
          updated_at
        `,
      )
      .eq("user_id", user.id)
      .eq(
        "etsy_shop_id",
        shop.shopId,
      )
      .order(
        "listing_title",
        {
          ascending: true,
        },
      );

    if (error) {
      console.error(
        "Product costs lookup failed:",
        error,
      );

      throw new Error(
        "SellerOS could not load product costs.",
      );
    }

    return NextResponse.json({
      success: true,
      costs: data ?? [],
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

    if (
      error instanceof EtsyAccessError
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

    console.error(
      "Product costs GET failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "SellerOS could not load product costs.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PUT(
  request: NextRequest,
) {
  try {
    const { user } =
      await requireProSubscription();

    const {
      repository,
    } = await createEtsyRepository(
      request,
    );

    const shop =
      await repository.getShop();

    const body =
      (await request.json()) as ProductCostInput;

    const etsyListingId =
      readNumber(
        body.etsyListingId,
      );

    if (
      etsyListingId === null ||
      !Number.isInteger(
        etsyListingId,
      ) ||
      etsyListingId < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A valid Etsy listing ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const materialCost =
      readNumber(
        body.materialCost,
      ) ?? 0;

    const packagingCost =
      readNumber(
        body.packagingCost,
      ) ?? 0;

    const laborCost =
      readNumber(
        body.laborCost,
      ) ?? 0;

    const otherUnitCost =
      readNumber(
        body.otherUnitCost,
      ) ?? 0;

    const costs = [
      materialCost,
      packagingCost,
      laborCost,
      otherUnitCost,
    ];

    if (
      costs.some(
        (value) =>
          value < 0,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Product costs cannot be negative.",
        },
        {
          status: 400,
        },
      );
    }

    const listingTitle =
      readText(
        body.listingTitle,
      );

    const currency =
      readText(
        body.currency,
      ) || "USD";

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("etsy_product_costs")
      .upsert(
        {
          user_id: user.id,

          etsy_shop_id:
            shop.shopId,

          etsy_listing_id:
            etsyListingId,

          listing_title:
            listingTitle || null,

          material_cost:
            materialCost,

          packaging_cost:
            packagingCost,

          labor_cost:
            laborCost,

          other_unit_cost:
            otherUnitCost,

          currency,
        },
        {
          onConflict:
            "user_id,etsy_shop_id,etsy_listing_id",
        },
      )
      .select(
        `
          id,
          etsy_shop_id,
          etsy_listing_id,
          listing_title,
          material_cost,
          packaging_cost,
          labor_cost,
          other_unit_cost,
          currency,
          updated_at
        `,
      )
      .single();

    if (error) {
      console.error(
        "Product cost save failed:",
        error,
      );

      throw new Error(
        "SellerOS could not save the product cost.",
      );
    }

    return NextResponse.json({
      success: true,
      cost: data,
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

    if (
      error instanceof EtsyAccessError
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

    console.error(
      "Product costs PUT failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "SellerOS could not save the product cost.",
      },
      {
        status: 500,
      },
    );
  }
}