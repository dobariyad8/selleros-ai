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

import { EtsyApiError } from "@/lib/etsy/client";
import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

function readUnixTimestamp(
  value: string | null,
) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed < 0
  ) {
    return undefined;
  }

  return Math.floor(parsed);
}

function readMoney(
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

  return 0;
}

function roundMoney(
  value: number,
) {
  return Number(
    value.toFixed(2),
  );
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

    const minCreated =
      readUnixTimestamp(
        request.nextUrl.searchParams.get(
          "minCreated",
        ),
      );

    const maxCreated =
      readUnixTimestamp(
        request.nextUrl.searchParams.get(
          "maxCreated",
        ),
      );

    if (
      typeof minCreated === "number" &&
      typeof maxCreated === "number" &&
      minCreated > maxCreated
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The finance start date cannot be after the end date.",
        },
        {
          status: 400,
        },
      );
    }

    const {
      data: productCosts,
      error,
    } = await supabaseAdmin
      .from("etsy_product_costs")
      .select(
        `
          etsy_listing_id,
          listing_title,
          material_cost,
          packaging_cost,
          labor_cost,
          other_unit_cost,
          currency
        `,
      )
      .eq("user_id", user.id)
      .eq(
        "etsy_shop_id",
        shop.shopId,
      );

    if (error) {
      console.error(
        "COGS product cost lookup failed:",
        error,
      );

      throw new Error(
        "SellerOS could not load product costs.",
      );
    }

    const rows =
      productCosts ?? [];

    const breakdown =
      await Promise.all(
        rows.map(
          async (cost) => {
            const listingId =
              Number(
                cost.etsy_listing_id,
              );

            const sales =
              await repository.getListingSalesRangeMetrics(
                shop.shopId,
                listingId,
                {
                  minCreated,
                  maxCreated,
                },
              );

            const unitCost =
              readMoney(
                cost.material_cost,
              ) +
              readMoney(
                cost.packaging_cost,
              ) +
              readMoney(
                cost.labor_cost,
              ) +
              readMoney(
                cost.other_unit_cost,
              );

            const cogs =
              unitCost *
              sales.unitsSold;

            return {
              listingId,

              listingTitle:
                cost.listing_title ??
                `Listing ${listingId}`,

              unitsSold:
                sales.unitsSold,

              transactionCount:
                sales.transactionCount,

              unitCost:
                roundMoney(
                  unitCost,
                ),

              cogs:
                roundMoney(
                  cogs,
                ),

              currency:
                cost.currency ??
                "USD",
            };
          },
        ),
      );

    const totalCogs =
      roundMoney(
        breakdown.reduce(
          (
            total,
            item,
          ) =>
            total +
            item.cogs,
          0,
        ),
      );

    const totalUnitsSold =
      breakdown.reduce(
        (
          total,
          item,
        ) =>
          total +
          item.unitsSold,
        0,
      );

    return NextResponse.json({
      success: true,

      shop: {
        shopId:
          shop.shopId,

        shopName:
          shop.shopName,
      },

      range: {
        minCreated:
          minCreated ?? null,

        maxCreated:
          maxCreated ?? null,
      },

      summary: {
        totalCogs,
        totalUnitsSold,
        listingCount:
          breakdown.length,
      },

      breakdown,
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

    if (
      error instanceof EtsyApiError
    ) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        {
          status: error.status,
        },
      );
    }

    console.error(
      "COGS GET failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "SellerOS could not calculate COGS.",
      },
      {
        status: 500,
      },
    );
  }
}