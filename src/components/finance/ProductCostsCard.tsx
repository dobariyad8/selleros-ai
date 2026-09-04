"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  LoaderCircle,
  PackageSearch,
  Save,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ProductCost = {
  id: string;
  etsy_shop_id: number;
  etsy_listing_id: number;
  listing_title: string | null;

  material_cost: number | string;
  packaging_cost: number | string;
  labor_cost: number | string;
  other_unit_cost: number | string;

  currency: string;
  updated_at: string;
};

type EtsyListing = {
  listingId: number;
  title: string;
};

type EtsyListingsResponse = {
  success: boolean;
  listings?: EtsyListing[];
  error?: string;
};

type ProductCostsResponse = {
  success: boolean;
  costs?: ProductCost[];
  cost?: ProductCost;
  error?: string;
};

function formatMoney(
  value: number | string,
  currency: string,
) {
  const parsed =
    typeof value === "number"
      ? value
      : Number(value);

  if (!Number.isFinite(parsed)) {
    return "—";
  }

  try {
    return new Intl.NumberFormat(
      undefined,
      {
        style: "currency",
        currency,
      },
    ).format(parsed);
  } catch {
    return `${parsed.toFixed(
      2,
    )} ${currency}`;
  }
}

function readCost(
  value: number | string,
) {
  const parsed =
    typeof value === "number"
      ? value
      : Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

export default function ProductCostsCard() {
  const [
    costs,
    setCosts,
  ] = useState<ProductCost[]>([]);

  const [
    etsyListingId,
    setEtsyListingId,
  ] = useState("");

  const [
    listingTitle,
    setListingTitle,
  ] = useState("");

  const [
    materialCost,
    setMaterialCost,
  ] = useState("");

  const [
    packagingCost,
    setPackagingCost,
  ] = useState("");

  const [
      listings,
      setListings,
    ] = useState<EtsyListing[]>([]);

  const [
    laborCost,
    setLaborCost,
  ] = useState("");

  const [
    otherUnitCost,
    setOtherUnitCost,
  ] = useState("");

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const loadListings =
      useCallback(async () => {
        try {
          const response = await fetch(
            "/api/etsy/listings",
            {
              method: "GET",
              cache: "no-store",
            },
          );

          const data =
            (await response.json()) as EtsyListingsResponse;

          if (
            !response.ok ||
            !data.success
          ) {
            throw new Error(
              data.error ||
                "Etsy listings could not be loaded.",
            );
          }

          setListings(
            data.listings ?? [],
          );
        } catch (loadError) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Etsy listings could not be loaded.",
          );
        }
      }, []);

  const loadCosts =
    useCallback(async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          "/api/etsy/finance/product-costs",
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const data =
          (await response.json()) as ProductCostsResponse;

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              "Product costs could not be loaded.",
          );
        }

        setCosts(
          data.costs ?? [],
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Product costs could not be loaded.",
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
      void Promise.all([
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadCosts(),
        loadListings(),
      ]);
    }, [
      loadCosts,
      loadListings,
    ]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const listingId =
        Number(etsyListingId);

      if (
        !Number.isInteger(
          listingId,
        ) ||
        listingId < 1
      ) {
        throw new Error(
          "Enter a valid Etsy listing ID.",
        );
      }

      const values = {
        materialCost:
          Number(materialCost || 0),

        packagingCost:
          Number(
            packagingCost || 0,
          ),

        laborCost:
          Number(laborCost || 0),

        otherUnitCost:
          Number(
            otherUnitCost || 0,
          ),
      };

      if (
        Object.values(
          values,
        ).some(
          (value) =>
            !Number.isFinite(
              value,
            ) ||
            value < 0,
        )
      ) {
        throw new Error(
          "All product costs must be valid numbers of 0 or more.",
        );
      }

      const response = await fetch(
        "/api/etsy/finance/product-costs",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            etsyListingId:
              listingId,

            listingTitle,

            ...values,

            currency: "USD",
          }),
        },
      );

      const data =
        (await response.json()) as ProductCostsResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Product cost could not be saved.",
        );
      }

      setEtsyListingId("");
      setListingTitle("");
      setMaterialCost("");
      setPackagingCost("");
      setLaborCost("");
      setOtherUnitCost("");

      setSuccess(
        "Product cost saved.",
      );

      await loadCosts();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Product cost could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <PackageSearch className="size-5" />
          </div>

          <div>
            <CardTitle>
              Product Costs
            </CardTitle>

            <CardDescription className="mt-1">
              Store the per-unit cost of each Etsy
              product so SellerOS can calculate COGS
              and estimated real profit.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-xl border p-4 md:grid-cols-2 xl:grid-cols-3"
        >
          <div>
              <label className="mb-2 block text-xs font-medium text-muted-foreground">
                Etsy Listing
              </label>

              <select
                value={etsyListingId}
                onChange={(event) => {
                  const value =
                    event.target.value;
                
                  setEtsyListingId(
                    value,
                  );
              
                  const selected =
                    listings.find(
                      (listing) =>
                        String(
                          listing.listingId,
                        ) === value,
                    );
                
                  setListingTitle(
                    selected?.title ?? "",
                  );
                }}
                required
                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">
                  Select an Etsy listing
                </option>
            
                {listings.map(
                  (listing) => (
                    <option
                      key={
                        listing.listingId
                      }
                      value={
                        listing.listingId
                      }
                    >
                      {listing.title}
                    </option>
                  ),
                )}
              </select>
            </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              Listing Title
            </label>

            <input
              type="text"
              value={listingTitle}
              readOnly
              placeholder="Selected automatically"
              className="h-10 w-full rounded-md border bg-muted px-3 text-sm text-muted-foreground"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              Material Cost
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={
                materialCost
              }
              onChange={(
                event,
              ) =>
                setMaterialCost(
                  event.target
                    .value,
                )
              }
              placeholder="0.00"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              Packaging Cost
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={
                packagingCost
              }
              onChange={(
                event,
              ) =>
                setPackagingCost(
                  event.target
                    .value,
                )
              }
              placeholder="0.00"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              Labor Cost
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={
                laborCost
              }
              onChange={(
                event,
              ) =>
                setLaborCost(
                  event.target
                    .value,
                )
              }
              placeholder="0.00"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              Other Unit Cost
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={
                otherUnitCost
              }
              onChange={(
                event,
              ) =>
                setOtherUnitCost(
                  event.target
                    .value,
                )
              }
              placeholder="0.00"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="md:col-span-2 xl:col-span-3">
            <Button
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}

              Save Product Cost
            </Button>
          </div>
        </form>

        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
          >
            {error}
          </div>
        ) : null}

        {success ? (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            {success}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex min-h-32 items-center justify-center">
            <LoaderCircle className="size-6 animate-spin text-primary" />
          </div>
        ) : costs.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            No product costs saved yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-225 text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-3 py-3 font-medium">
                    Listing
                  </th>

                  <th className="px-3 py-3 text-right font-medium">
                    Materials
                  </th>

                  <th className="px-3 py-3 text-right font-medium">
                    Packaging
                  </th>

                  <th className="px-3 py-3 text-right font-medium">
                    Labor
                  </th>

                  <th className="px-3 py-3 text-right font-medium">
                    Other
                  </th>

                  <th className="px-3 py-3 text-right font-medium">
                    Unit Cost
                  </th>
                </tr>
              </thead>

              <tbody>
                {costs.map(
                  (cost) => {
                    const total =
                      readCost(
                        cost.material_cost,
                      ) +
                      readCost(
                        cost.packaging_cost,
                      ) +
                      readCost(
                        cost.labor_cost,
                      ) +
                      readCost(
                        cost.other_unit_cost,
                      );

                    return (
                      <tr
                        key={
                          cost.id
                        }
                        className="border-b last:border-0"
                      >
                        <td className="px-3 py-3">
                          <p className="font-medium">
                            {cost.listing_title ||
                              `Listing ${cost.etsy_listing_id}`}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            ID:{" "}
                            {
                              cost.etsy_listing_id
                            }
                          </p>
                        </td>

                        <td className="px-3 py-3 text-right">
                          {formatMoney(
                            cost.material_cost,
                            cost.currency ||
                              "USD",
                          )}
                        </td>

                        <td className="px-3 py-3 text-right">
                          {formatMoney(
                            cost.packaging_cost,
                            cost.currency ||
                              "USD",
                          )}
                        </td>

                        <td className="px-3 py-3 text-right">
                          {formatMoney(
                            cost.labor_cost,
                            cost.currency ||
                              "USD",
                          )}
                        </td>

                        <td className="px-3 py-3 text-right">
                          {formatMoney(
                            cost.other_unit_cost,
                            cost.currency ||
                              "USD",
                          )}
                        </td>

                        <td className="px-3 py-3 text-right font-semibold">
                          {formatMoney(
                            total,
                            cost.currency ||
                              "USD",
                          )}
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}