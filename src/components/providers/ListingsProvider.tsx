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

  setListings: (listings: SellerOsListing[]) => void;
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
  const [listingState, setListingState] = useState<
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
    async (manualRefresh = false) => {
      if (manualRefresh) {
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

        const receivedListings = data.listings ?? [];

        setListingState(receivedListings);
        setShop(data.shop ?? null);
        setCount(data.count ?? receivedListings.length);

        setTotalAvailable(
          data.totalAvailable ??
            data.count ??
            receivedListings.length
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

  /*
   * This runs once when the provider is mounted.
   * loadListings is stable because it uses useCallback.
   */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadListings();
  }, [loadListings]);

  /*
   * Used by the CSV importer.
   *
   * We update the listings and counts together so the UI
   * remains consistent after importing a CSV file.
   */
  const setListings = useCallback(
    (listings: SellerOsListing[]) => {
      setListingState(listings);
      setCount(listings.length);
      setTotalAvailable(listings.length);
      setError(null);
    },
    []
  );

  const value = useMemo<ListingsContextValue>(
    () => ({
      listings: listingState,
      shop,
      count,
      totalAvailable,
      isLoading,
      isRefreshing,
      error,
      setListings,
      refreshListings,
    }),
    [
      listingState,
      shop,
      count,
      totalAvailable,
      isLoading,
      isRefreshing,
      error,
      setListings,
      refreshListings,
    ]
  );

  return (
    <ListingsContext.Provider value={value}>
      {children}
    </ListingsContext.Provider>
  );
}