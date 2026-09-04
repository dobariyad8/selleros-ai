import {
  convertEtsyMoney,
  type EtsyPayment,
  type EtsyPaymentAccountLedgerEntry,
} from "@/lib/etsy/financeTypes";

export type EtsyFinanceBreakdown = {
  grossRevenue: number;
  paymentFees: number;
  paymentNet: number;

  refunds: number;

  ledgerCredits: number;
  ledgerDebits: number;
  ledgerNet: number;

  paymentCount: number;
  ledgerEntryCount: number;

  currency: string | null;
      ledgerCategories: {
      key: string;
      ledgerType: string | null;
      referenceType: string | null;
      description: string | null;
      credits: number;
      debits: number;
      net: number;
      count: number;
    }[];

  salesRevenue: number;

  transactionFees: number;
  processingFees: number;
  listingFees: number;
  offsiteAdsFees: number;
  shippingLabels: number;
  
  salesTax: number;
  
  disbursements: number;
  
  otherCredits: number;
  otherDebits: number;
  netSales: number;
  etsyNetProfit: number;
};

function roundMoney(
  value: number,
) {
  return Math.round(
    (value + Number.EPSILON) * 100,
  ) / 100;
}

export function calculateEtsyFinance(
  payments: EtsyPayment[],
  ledgerEntries:
    EtsyPaymentAccountLedgerEntry[],
): EtsyFinanceBreakdown {
  let grossRevenue = 0;
  let paymentFees = 0;
  let paymentNet = 0;

  let refunds = 0;
  let salesRevenue = 0;

  let transactionFees = 0;
  let processingFees = 0;
  let listingFees = 0;
  let offsiteAdsFees = 0;
  let shippingLabels = 0;
  
  let salesTax = 0;
  
  let disbursements = 0;
  
  let otherCredits = 0;
  let otherDebits = 0;

  let ledgerCredits = 0;
  let ledgerDebits = 0;

  let currency: string | null =
    null;

  const categoryMap =
      new Map<
        string,
        {
          ledgerType: string | null;
          referenceType: string | null;
          description: string | null;
          credits: number;
          debits: number;
          count: number;
        }
      >();

  for (const payment of payments) {
    const gross =
      convertEtsyMoney(
        payment.adjusted_gross ??
          payment.amount_gross ??
          payment.posted_gross,
      );

    const fees =
      convertEtsyMoney(
        payment.adjusted_fees ??
          payment.amount_fees ??
          payment.posted_fees,
      );

    const net =
      convertEtsyMoney(
        payment.adjusted_net ??
          payment.amount_net ??
          payment.posted_net,
      );

    grossRevenue += gross.amount;
    paymentFees += fees.amount;
    paymentNet += net.amount;

    currency =
      currency ??
      gross.currency ??
      fees.currency ??
      net.currency ??
      payment.shop_currency ??
      payment.currency ??
      null;
  }

  for (
    const entry of ledgerEntries
  ) {
    const amount =
      typeof entry.amount === "number"
        ? entry.amount / 100
        : 0;

    const ledgerType =
      typeof entry.ledger_type === "string"
        ? entry.ledger_type.trim()
        : "";

    switch (ledgerType) {
      case "PAYMENT_GROSS": {
        if (amount > 0) {
          salesRevenue += amount;
        }

        break;
      }

      case "REFUND_GROSS": {
        if (amount < 0) {
          refunds += Math.abs(amount);
        }

        break;
      }

      case "transaction":
      case "shipping_transaction":
      case "transaction_quantity": {
        if (amount < 0) {
          transactionFees +=
            Math.abs(amount);
        }

        break;
      }

      case "transaction_refund":
      case "shipping_transaction_refund": {
        if (amount > 0) {
          transactionFees -= amount;
        }

        break;
      }

      case "PAYMENT_PROCESSING_FEE": {
        if (amount < 0) {
          processingFees +=
            Math.abs(amount);
        }

        break;
      }

      case "REFUND_PROCESSING_FEE": {
        if (amount > 0) {
          processingFees -= amount;
        }

        break;
      }

      case "listing":
      case "renew_sold_auto":
      case "auto_renew_expired": {
        if (amount < 0) {
          listingFees +=
            Math.abs(amount);
        }

        break;
      }

      case "offsite_ads_fee": {
        if (amount < 0) {
          offsiteAdsFees +=
            Math.abs(amount);
        }

        break;
      }

      case "shipping_labels": {
        if (amount < 0) {
          shippingLabels +=
            Math.abs(amount);
        }

        break;
      }

      case "sales_tax": {
        if (amount < 0) {
          salesTax +=
            Math.abs(amount);
        }

        break;
      }

      case "sales_tax_refund": {
        if (amount > 0) {
          salesTax -= amount;
        }

        break;
      }

      case "DISBURSE2": {
        if (amount < 0) {
          disbursements +=
            Math.abs(amount);
        }

        break;
      }

      case "SELLER_DRIVEN_TRAFFIC_CREDIT": {
        if (amount > 0) {
          otherCredits += amount;
        }

        break;
      }

      default: {
        if (amount > 0) {
          otherCredits += amount;
        }

        if (amount < 0) {
          otherDebits +=
            Math.abs(amount);
        }

        break;
      }
    }
    
    const categoryLedgerType =
      ledgerType || null;

    const referenceType =
      typeof entry.reference_type ===
      "string"
        ? entry.reference_type.trim()
        : null;

    const description =
      typeof entry.description ===
      "string"
        ? entry.description.trim()
        : null;

    const categoryKey = [
      categoryLedgerType ?? "unknown",
      referenceType ?? "unknown",
      description ?? "unknown",
    ].join("|");

    const existingCategory =
      categoryMap.get(categoryKey) ?? {
        ledgerType:
          categoryLedgerType,
        referenceType,
        description,
        credits: 0,
        debits: 0,
        count: 0,
      };

    existingCategory.count += 1;

    if (amount >= 0) {
      existingCategory.credits +=
        amount;
    } else {
      existingCategory.debits +=
        Math.abs(amount);
    }

    categoryMap.set(
      categoryKey,
      existingCategory,
    );

    if (amount >= 0) {
      ledgerCredits += amount;
    } else {
      ledgerDebits +=
        Math.abs(amount);
    }

    currency =
      currency ??
      entry.currency ??
      null;

  }

  const ledgerCategories = [
      ...categoryMap.entries(),
    ]
      .map(
        ([key, category]) => ({
          key,

          ledgerType:
            category.ledgerType,

          referenceType:
            category.referenceType,

          description:
            category.description,

          credits:
            roundMoney(
              category.credits,
            ),

          debits:
            roundMoney(
              category.debits,
            ),

          net:
            roundMoney(
              category.credits -
                category.debits,
            ),

          count:
            category.count,
        }),
      )
      .sort(
        (a, b) =>
          b.debits +
          b.credits -
          (a.debits +
            a.credits),
      );

    const netSales =
      salesRevenue -
      refunds -
      salesTax;

    const etsyNetProfit =
      netSales -
      transactionFees -
      processingFees -
      listingFees -
      offsiteAdsFees -
      shippingLabels +
      otherCredits -
      otherDebits;

  return {
    grossRevenue:
      roundMoney(
        grossRevenue,
      ),

    paymentFees:
      roundMoney(
        Math.abs(paymentFees),
      ),

    paymentNet:
      roundMoney(
        paymentNet,
      ),

    refunds:
      roundMoney(
        refunds,
      ),

    ledgerCredits:
      roundMoney(
        ledgerCredits,
      ),

    ledgerDebits:
      roundMoney(
        ledgerDebits,
      ),

    ledgerNet:
      roundMoney(
        ledgerCredits -
          ledgerDebits,
      ),

    paymentCount:
      payments.length,

    ledgerEntryCount:
      ledgerEntries.length,

    currency,
    ledgerCategories,

    salesRevenue:
      roundMoney(
        salesRevenue,
      ),

    transactionFees:
      roundMoney(
        Math.max(
          0,
          transactionFees,
        ),
      ),

    processingFees:
      roundMoney(
        Math.max(
          0,
          processingFees,
        ),
      ),

    listingFees:
      roundMoney(
        listingFees,
      ),

    offsiteAdsFees:
      roundMoney(
        offsiteAdsFees,
      ),

    shippingLabels:
      roundMoney(
        shippingLabels,
      ),

    salesTax:
      roundMoney(
        Math.max(
          0,
          salesTax,
        ),
      ),

    disbursements:
      roundMoney(
        disbursements,
      ),

    otherCredits:
      roundMoney(
        otherCredits,
      ),

    otherDebits:
      roundMoney(
        otherDebits,
      ),

    netSales:
      roundMoney(
        netSales,
      ),
    
    etsyNetProfit:
      roundMoney(
        etsyNetProfit,
      ),
  };
}