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

import type {
  EtsyPayment,
  EtsyPaymentAccountLedgerEntry,
} from "@/lib/etsy/financeTypes";

import {
  calculateEtsyFinance,
} from "@/lib/finance/calculateEtsyFinance";

import { EtsyApiError } from "@/lib/etsy/client";

export const runtime = "nodejs";

function readUnixTimestamp(
  value: string | null,
) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed < 0
  ) {
    return null;
  }

  return Math.floor(parsed);
}

function getPaymentTimestamp(
  payment: EtsyPayment,
) {
  return (
    payment.created_timestamp ??
    payment.create_timestamp ??
    payment.updated_timestamp ??
    0
  );
}

function getLedgerTimestamp(
  entry: EtsyPaymentAccountLedgerEntry,
) {
  return (
    entry.created_timestamp ??
    entry.create_date ??
    0
  );
}

export async function GET(
  request: NextRequest,
) {
  try {
    await requireProSubscription();

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
      minCreated !== null &&
      maxCreated !== null &&
      minCreated > maxCreated
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The start date must be before the end date.",
        },
        {
          status: 400,
        },
      );
    }

    const {
      repository,
    } = await createEtsyRepository(
      request,
    );

    const shop =
      await repository.getShop();

    const ledgerEntries =
      await repository.getPaymentAccountLedgerEntries(
        shop.shopId,
        {
          ...(minCreated !== null
            ? {
                minCreated,
              }
            : {}),

          ...(maxCreated !== null
            ? {
                maxCreated,
              }
            : {}),
        },
      );

    const ledgerEntryIds =
      ledgerEntries
        .map(
          (entry) =>
            entry.entry_id,
        )
        .filter(
          (
            entryId,
          ): entryId is number =>
            typeof entryId === "number" &&
            Number.isInteger(entryId) &&
            entryId > 0,
        );

    const payments =
      await repository.getPaymentsForLedgerEntries(
        shop.shopId,
        ledgerEntryIds,
      );

    const filteredPayments =
      payments.filter((payment) => {
        const timestamp =
          getPaymentTimestamp(
            payment,
          );

        if (
          minCreated !== null &&
          timestamp < minCreated
        ) {
          return false;
        }

        if (
          maxCreated !== null &&
          timestamp > maxCreated
        ) {
          return false;
        }

        return true;
      });

    const filteredLedgerEntries =
      ledgerEntries.filter((entry) => {
        const timestamp =
          getLedgerTimestamp(
            entry,
          );

        if (
          minCreated !== null &&
          timestamp < minCreated
        ) {
          return false;
        }

        if (
          maxCreated !== null &&
          timestamp > maxCreated
        ) {
          return false;
        }

        return true;
      });

    const finance =
  calculateEtsyFinance(
    filteredPayments,
    filteredLedgerEntries,
  );

    return NextResponse.json({
      success: true,

      shop: {
        shopId: shop.shopId,
        shopName: shop.shopName,
      },

      range: {
        minCreated,
        maxCreated,
      },

      currency: finance.currency,

      summary: {
        grossRevenue:
          finance.grossRevenue,
      
        paymentFees:
          finance.paymentFees,
      
        paymentNet:
          finance.paymentNet,
      
        refunds:
          finance.refunds,
      
        ledgerCredits:
          finance.ledgerCredits,
      
        ledgerDebits:
          finance.ledgerDebits,
      
        ledgerNet:
          finance.ledgerNet,
      
        paymentCount:
          finance.paymentCount,
      
        ledgerEntryCount:
          finance.ledgerEntryCount,

        ledgerCategories:
          finance.ledgerCategories,

        salesRevenue:
          finance.salesRevenue,

        transactionFees:
          finance.transactionFees,

        processingFees:
          finance.processingFees,

        listingFees:
          finance.listingFees,

        offsiteAdsFees:
          finance.offsiteAdsFees,

        shippingLabels:
          finance.shippingLabels,

        salesTax:
          finance.salesTax,

        disbursements:
          finance.disbursements,

        otherCredits:
          finance.otherCredits,

        otherDebits:
          finance.otherDebits,

        netSales:
          finance.netSales,

        etsyNetProfit:
          finance.etsyNetProfit,
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
      console.error(
        "Etsy finance request failed:",
        error,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "SellerOS could not retrieve Etsy financial data.",
        },
        {
          status: error.status,
        },
      );
    }

    console.error(
      "SellerOS finance summary failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "SellerOS could not calculate your financial summary.",
      },
      {
        status: 500,
      },
    );
  }
}