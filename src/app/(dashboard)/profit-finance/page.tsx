"use client";

import Link from "next/link";
import BusinessExpensesCard from "@/components/finance/BusinessExpensesCard";
import ProductCostsCard from "@/components/finance/ProductCostsCard";

import {
  DollarSign,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useSubscription } from "@/hooks/useSubscription";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  financeDateRangeOptions,
  getFinanceDateRange,
  type FinanceDateRangeKey,
} from "@/lib/finance/dateRanges";

type FinanceSummary = {
  grossRevenue: number;
  paymentFees: number;
  paymentNet: number;

  refunds: number;

  ledgerCredits: number;
  ledgerDebits: number;
  ledgerNet: number;

  paymentCount: number;
  ledgerEntryCount: number;

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

type FinanceResponse = {
  success: boolean;

  shop?: {
    shopId: number;
    shopName: string;
  };

  currency?: string | null;

  summary?: FinanceSummary;

  error?: string;
};

type ExpensesSummaryResponse = {
  success: boolean;

  expenses?: {
    amount: number | string;
  }[];

  error?: string;
};

type CogsSummaryResponse = {
  success: boolean;

  summary?: {
    totalCogs: number;
    totalUnitsSold: number;
    listingCount: number;
  };

  breakdown?: {
    listingId: number;
    listingTitle: string;
    unitsSold: number;
    transactionCount: number;
    unitCost: number;
    cogs: number;
    currency: string;
  }[];

  error?: string;
};



function formatMoney(
  amount: number,
  currency: string | null,
) {
  if (!currency) {
    return amount.toFixed(2);
  }

  try {
    return new Intl.NumberFormat(
      undefined,
      {
        style: "currency",
        currency,
      },
    ).format(amount);
  } catch {
    return `${amount.toFixed(
      2,
    )} ${currency}`;
  }
}

function formatLocalDate(
  date: Date,
) {
  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1,
    ).padStart(2, "0"),
    String(
      date.getDate(),
    ).padStart(2, "0"),
  ].join("-");
}

export default function ProfitFinancePage() {
  const {
    hasProAccess,
    isLoading: isSubscriptionLoading,
  } = useSubscription();

  const [
    summary,
    setSummary,
  ] = useState<FinanceSummary | null>(
    null,
  );

  const [
    cogsSummary,
    setCogsSummary,
  ] = useState<
    CogsSummaryResponse["summary"] | null
  >(null);

  const [
    manualExpensesTotal,
    setManualExpensesTotal,
  ] = useState(0);
  
  const [
    cogsBreakdown,
    setCogsBreakdown,
  ] = useState<
    NonNullable<
      CogsSummaryResponse["breakdown"]
    >
  >([]);

  const [
      selectedRange,
      setSelectedRange,
    ] = useState<FinanceDateRangeKey>(
      "this_month",
    );

  const [
    currency,
    setCurrency,
  ] = useState<string | null>(null);

  const [
    shopName,
    setShopName,
  ] = useState("");

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const loadExpensesTotal =
  useCallback(async () => {
    const range =
      getFinanceDateRange(
        selectedRange,
      );

    const minDate =
      formatLocalDate(
        range.start,
      );

    const maxDate =
      formatLocalDate(
        range.end,
      );

    try {
      const response =
        await fetch(
          `/api/etsy/finance/expenses?minDate=${minDate}&maxDate=${maxDate}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

      const data =
        (await response.json()) as ExpensesSummaryResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Business expenses could not be loaded.",
        );
      }

      const total =
        (data.expenses ?? []).reduce(
          (
            sum,
            expense,
          ) => {
            const amount =
              typeof expense.amount ===
                "number"
                ? expense.amount
                : Number(
                    expense.amount,
                  );

            return (
              sum +
              (Number.isFinite(
                amount,
              )
                ? amount
                : 0)
            );
          },
          0,
        );

      setManualExpensesTotal(
        Number(
          total.toFixed(2),
        ),
      );
    } catch (error) {
      console.error(
        "Expense total load failed:",
        error,
      );

      setManualExpensesTotal(0);
    }
  }, [selectedRange]);

  const loadCogsData =
  useCallback(async () => {
    const range =
      getFinanceDateRange(
        selectedRange,
      );

    try {
      const response =
        await fetch(
          `/api/etsy/finance/cogs?minCreated=${range.minCreated}&maxCreated=${range.maxCreated}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

      const data =
        (await response.json()) as CogsSummaryResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "COGS could not be calculated.",
        );
      }

      setCogsSummary(
        data.summary ?? null,
      );

      setCogsBreakdown(
        data.breakdown ?? [],
      );
    } catch (error) {
      console.error(
        "COGS load failed:",
        error,
      );

      setCogsSummary(null);
      setCogsBreakdown([]);
    }
  }, [selectedRange]);

  const loadFinanceData =
    useCallback(async () => {
      if (
        isSubscriptionLoading ||
        !hasProAccess
      ) {
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const range =
  getFinanceDateRange(
    selectedRange,
  );

  

        const searchParams =
          new URLSearchParams({
            minCreated: String(
              range.minCreated,
            ),

            maxCreated: String(
              range.maxCreated,
            ),
          });

        const response = await fetch(
          `/api/etsy/finance/summary?${searchParams.toString()}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const data =
          (await response.json()) as FinanceResponse;

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              "Financial data could not be loaded.",
          );
        }

        setSummary(
          data.summary ?? null,
        );

        setCurrency(
          data.currency ?? null,
        );

        setShopName(
          data.shop?.shopName ?? "",
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Financial data could not be loaded.",
        );
      } finally {
        setIsLoading(false);
      }
    }, [
      hasProAccess,
      isSubscriptionLoading,
      selectedRange,
    ]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadFinanceData();
    void loadCogsData();
    void loadExpensesTotal();
  }, [loadCogsData, loadExpensesTotal, loadFinanceData]);

  const estimatedBusinessProfit =
  summary
    ? summary.etsyNetProfit -
      (cogsSummary?.totalCogs ?? 0) -
      manualExpensesTotal
    : null;

  if (isSubscriptionLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 lg:px-0">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <DollarSign className="size-5" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Profit & Finance
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Know what your Etsy shop actually made.
            </p>
          </div>
        </div>

        <Card className="mt-6">
          <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            Checking your SellerOS plan…
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasProAccess) {
    return (
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 lg:px-0">
        <Card className="mx-auto max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <LockKeyhole className="size-5" />
            </div>

            <CardTitle>
              Profit & Finance is a Pro feature
            </CardTitle>

            <CardDescription>
              Upgrade to SellerOS Pro to track
              revenue, Etsy fees, refunds,
              shipping, expenses, and estimated
              profit.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex justify-center">
            <Button
              nativeButton={false}
              render={
                <Link href="/subscription" />
              }
            >
              <Sparkles className="size-4" />
              View SellerOS Pro
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 lg:px-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <DollarSign className="size-5" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Profit & Finance
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Know what your Etsy shop actually
              made. Track revenue, Etsy fees,
              refunds, shipping, expenses, and
              estimated profit.
            </p>

            {shopName ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Etsy shop: {shopName}
              </p>
            ) : null}
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={isLoading}
          onClick={() =>
            void loadFinanceData()
          }
        >
          <RefreshCw
            className={
              isLoading
                ? "size-4 animate-spin"
                : "size-4"
            }
          />

          Refresh
        </Button>
      </div>

      <div className="mt-6 rounded-xl border bg-muted/30 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">
                Date Range
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Choose the period you want SellerOS
                to analyze.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {financeDateRangeOptions.map(
                (option) => {
                  const isSelected =
                    option.key ===
                    selectedRange;
                
                  return (
                    <Button
                      key={option.key}
                      type="button"
                      size="sm"
                      variant={
                        isSelected
                          ? "default"
                          : "outline"
                      }
                      disabled={isLoading}
                      onClick={() =>
                        setSelectedRange(
                          option.key,
                        )
                      }
                    >
                      {option.label}
                    </Button>
                  );
                },
              )}
            </div>
          </div>
        </div>

      {error ? (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}

      {isLoading && !summary ? (
        <Card className="mt-6">
          <CardContent className="flex min-h-48 items-center justify-center">
            <div className="text-center">
              <LoaderCircle className="mx-auto size-8 animate-spin text-primary" />

              <p className="mt-3 text-sm font-medium">
                Loading Etsy financial data…
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">
                Etsy Sales
              </p>

              <p className="mt-2 text-3xl font-bold">
                {summary
                  ? formatMoney(
                      summary.netSales,
                      currency,
                    )
                  : "—"}
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                Gross Etsy payment activity
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">
                Etsy Payment Fees
              </p>

              <p className="mt-2 text-3xl font-bold">
                {summary
                  ? formatMoney(
                      summary.paymentFees,
                      currency,
                    )
                  : "—"}
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                Fees reported in Etsy payment
                records
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">
                Etsy Net Profit
              </p>

              <p className="mt-2 text-3xl font-bold">
                {summary
                  ? formatMoney(
                      summary.etsyNetProfit,
                      currency,
                    )
                  : "—"}
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                Etsy sales minus Etsy fees and shipping labels
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">
                Refunds
              </p>
                          
              <p className="mt-2 text-3xl font-bold">
                {summary
                  ? formatMoney(
                      summary.refunds,
                      currency,
                    )
                  : "—"}
              </p>
                
              <p className="mt-2 text-xs text-muted-foreground">
                Refunds reflected in adjusted Etsy
                payments
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {summary ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              Etsy Payment Account
            </CardTitle>

            <CardDescription>
              SellerOS found{" "}
              {summary.ledgerEntryCount} payment
              account ledger entries for the selected
              period.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border p-4">
                <p className="text-sm text-muted-foreground">
                  Ledger Credits
                </p>

                <p className="mt-2 text-lg font-bold">
                  {formatMoney(
                    summary.ledgerCredits,
                    currency,
                  )}
                </p>
              
                <p className="mt-1 text-xs text-muted-foreground">
                  Positive payment-account activity
                </p>
              </div>
              
              <div className="rounded-xl border p-4">
                <p className="text-sm text-muted-foreground">
                  Ledger Debits
                </p>
              
                <p className="mt-2 text-lg font-bold">
                  {formatMoney(
                    summary.ledgerDebits,
                    currency,
                  )}
                </p>
              
                <p className="mt-1 text-xs text-muted-foreground">
                  Charges and negative account activity
                </p>
              </div>
              
              <div className="rounded-xl border p-4">
                <p className="text-sm text-muted-foreground">
                  Ledger Net
                </p>
              
                <p className="mt-2 text-lg font-bold">
                  {formatMoney(
                    summary.ledgerNet,
                    currency,
                  )}
                </p>
              
                <p className="mt-1 text-xs text-muted-foreground">
                  Credits minus debits
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {summary ? (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>
                Etsy Financial Breakdown
              </CardTitle>

              <CardDescription>
                Detailed income, fees, refunds, shipping,
                taxes, and other Etsy payment-account
                activity for the selected period.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {[
                {
                  label: "Gross Customer Payments",
                  value: summary.salesRevenue,
                },
                {
                  label: "Refunds",
                  value: -summary.refunds,
                },
                {
                  label: "Transaction Fees",
                  value: -summary.transactionFees,
                },
                {
                  label: "Payment Processing Fees",
                  value: -summary.processingFees,
                },
                {
                  label: "Listing Fees",
                  value: -summary.listingFees,
                },
                {
                  label: "Offsite Ads Fees",
                  value: -summary.offsiteAdsFees,
                },
                {
                  label: "Shipping Labels",
                  value: -summary.shippingLabels,
                },
                {
                  label: "Other Etsy Credits",
                  value: summary.otherCredits,
                },
                {
                  label: "Other Etsy Debits",
                  value: -summary.otherDebits,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-4 rounded-xl border p-4"
                >
                  <p className="text-sm font-medium">
                    {item.label}
                  </p>
            
                  <p className="text-sm font-semibold">
                    {formatMoney(
                      item.value,
                      currency,
                    )}
                  </p>
                </div>
              ))}

              <div className="mt-4 border-t pt-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">
                      Sales Tax
                    </p>
          
                    <p className="mt-1 text-xs text-muted-foreground">
                      Shown separately and not counted as
                      business profit.
                    </p>
                  </div>
          
                  <p className="text-sm font-semibold">
                    {formatMoney(
                      summary.salesTax,
                      currency,
                    )}
                  </p>
                </div>
              </div>
                
              <div className="border-t pt-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">
                      Etsy Payouts to Bank
                    </p>
                
                    <p className="mt-1 text-xs text-muted-foreground">
                      For reconciliation only. Payouts are
                      not treated as expenses.
                    </p>
                  </div>
                
                  <p className="text-sm font-semibold">
                    {formatMoney(
                      summary.disbursements,
                      currency,
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {summary &&
            estimatedBusinessProfit !== null ? (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>
                    Estimated Business Profit
                  </CardTitle>
            
                  <CardDescription>
                    Etsy net profit after product costs
                    and additional business expenses.
                  </CardDescription>
                </CardHeader>
            
                <CardContent>
                  <div className="rounded-xl border p-5">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-muted-foreground">
                          Etsy Net Profit
                        </span>
            
                        <span className="font-medium">
                          {formatMoney(
                            summary.etsyNetProfit,
                            currency,
                          )}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-muted-foreground">
                          Cost of Goods Sold
                        </span>
                      
                        <span className="font-medium">
                          -
                          {formatMoney(
                            cogsSummary?.totalCogs ??
                              0,
                            currency,
                          )}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-muted-foreground">
                          Other Business Expenses
                        </span>
                      
                        <span className="font-medium">
                          -
                          {formatMoney(
                            manualExpensesTotal,
                            currency,
                          )}
                        </span>
                      </div>
                      
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold">
                              Estimated Business Profit
                            </p>
                      
                            <p className="mt-1 text-xs text-muted-foreground">
                              Before income taxes and
                              other unrecorded expenses.
                            </p>
                          </div>
                      
                          <p className="text-2xl font-bold">
                            {formatMoney(
                              estimatedBusinessProfit,
                              currency,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}

        {cogsSummary ? (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>
                Cost of Goods Sold
              </CardTitle>

              <CardDescription>
                Product cost multiplied by the
                number of units sold during the
                selected period.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border p-4">
                  <p className="text-xs text-muted-foreground">
                    Total COGS
                  </p>

                  <p className="mt-2 text-2xl font-bold">
                    {formatMoney(
                      cogsSummary.totalCogs,
                      currency,
                    )}
                  </p>
                </div>
                
                <div className="rounded-xl border p-4">
                  <p className="text-xs text-muted-foreground">
                    Units Sold
                  </p>
                
                  <p className="mt-2 text-2xl font-bold">
                    {cogsSummary.totalUnitsSold}
                  </p>
                </div>
                
                <div className="rounded-xl border p-4">
                  <p className="text-xs text-muted-foreground">
                    Products With Costs
                  </p>
                
                  <p className="mt-2 text-2xl font-bold">
                    {cogsSummary.listingCount}
                  </p>
                </div>
              </div>
                
              {cogsBreakdown.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-180 text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="px-3 py-3 font-medium">
                          Listing
                        </th>
            
                        <th className="px-3 py-3 text-right font-medium">
                          Units Sold
                        </th>
            
                        <th className="px-3 py-3 text-right font-medium">
                          Unit Cost
                        </th>
            
                        <th className="px-3 py-3 text-right font-medium">
                          COGS
                        </th>
                      </tr>
                    </thead>
            
                    <tbody>
                      {cogsBreakdown.map(
                        (item) => (
                          <tr
                            key={item.listingId}
                            className="border-b last:border-0"
                          >
                            <td className="px-3 py-3">
                              <p className="font-medium">
                                {item.listingTitle}
                              </p>
                        
                              <p className="mt-1 text-xs text-muted-foreground">
                                ID: {item.listingId}
                              </p>
                            </td>
                        
                            <td className="px-3 py-3 text-right">
                              {item.unitsSold}
                            </td>
                        
                            <td className="px-3 py-3 text-right">
                              {formatMoney(
                                item.unitCost,
                                item.currency ||
                                  currency,
                              )}
                            </td>
                          
                            <td className="px-3 py-3 text-right font-semibold">
                              {formatMoney(
                                item.cogs,
                                item.currency ||
                                  currency,
                              )}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <div className="mt-6">
          <ProductCostsCard />
        </div>

      <div className="mt-6">
          <BusinessExpensesCard />
      </div>

      <p className="mt-5 text-xs leading-5 text-muted-foreground">
        SellerOS financial reports help organize
        Etsy shop data and estimate business
        performance. They are not tax or accounting
        advice.
      </p>
    </div>
  );
}