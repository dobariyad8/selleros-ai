"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  EtsyShopSummary,
  SellerOsListing,
} from "@/lib/etsy/types";

type ListingsApiResponse = {
  success: boolean;
  shop?: EtsyShopSummary;
  count?: number;
  totalAvailable?: number;
  listings?: SellerOsListing[];
  error?: string;
};

export type ListingsContextValue = {
  listings: SellerOsListing[];
  shop: EtsyShopSummary | null;
  count: number;
  totalAvailable: number;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refreshListings: () => Promise<void>;
};

export const ListingsContext =
  createContext<ListingsContextValue | null>(null);

type ListingsProviderProps = {
  children: ReactNode;
};

export function ListingsProvider({
  children,
}: ListingsProviderProps) {
  const [listings, setListings] = useState<
    SellerOsListing[]
  >([]);

  const [shop, setShop] =
    useState<EtsyShopSummary | null>(null);

  const [count, setCount] = useState(0);
  const [totalAvailable, setTotalAvailable] =
    useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [error, setError] = useState<string | null>(
    null
  );

  const loadListings = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError(null);

      try {
        const response = await fetch(
          "/api/etsy/listings",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const data =
          (await response.json()) as ListingsApiResponse;

        if (!response.ok || !data.success) {
          throw new Error(
            data.error ??
              "Could not retrieve Etsy listings."
          );
        }

        setListings(data.listings ?? []);
        setShop(data.shop ?? null);
        setCount(data.count ?? 0);
        setTotalAvailable(
          data.totalAvailable ?? data.count ?? 0
        );
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "An unknown error occurred.";

        setError(message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  const refreshListings = useCallback(async () => {
    await loadListings(true);
  }, [loadListings]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadListings();
  }, [loadListings]);

  const value = useMemo<ListingsContextValue>(
    () => ({
      listings,
      shop,
      count,
      totalAvailable,
      isLoading,
      isRefreshing,
      error,
      refreshListings,
    }),
    [
      listings,
      shop,
      count,
      totalAvailable,
      isLoading,
      isRefreshing,
      error,
      refreshListings,
    ]
  );

  return (
    <ListingsContext.Provider value={value}>
      {children}
    </ListingsContext.Provider>
  );
}