"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import type {
  EtsyShopSummary,
  SellerOsListing,
} from "@/lib/etsy/types";

import {
  analyzeListing,
  type ListingAnalysis,
} from "@/lib/scoring/analyzeListing";

type ListingsApiResponse = {
  success: boolean;
  shop?: EtsyShopSummary;
  count?: number;
  totalAvailable?: number;
  listings?: SellerOsListing[];
  error?: string;
};

export type AnalyzedListing = {
  listing: SellerOsListing;
  analysis: ListingAnalysis;
};

export type ListingsContextValue = {
  listings: SellerOsListing[];
  analyzedListings: AnalyzedListing[];
  shop: EtsyShopSummary | null;
  count: number;
  totalAvailable: number;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: Dispatch<
    SetStateAction<string>
  >;
  refreshListings: () => Promise<void>;
};

export const ListingsContext =
  createContext<ListingsContextValue | null>(
    null,
  );

type ListingsProviderProps = {
  children: ReactNode;
};

export function ListingsProvider({
  children,
}: ListingsProviderProps) {
  const [listingState, setListingState] =
    useState<SellerOsListing[]>([]);

  const [shop, setShop] =
    useState<EtsyShopSummary | null>(null);

  const [count, setCount] = useState(0);

  const [totalAvailable, setTotalAvailable] =
    useState(0);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [searchQuery, setSearchQuery] =
    useState("");

  const analyzedListings =
    useMemo<AnalyzedListing[]>(
      () =>
        listingState.map((listing) => ({
          listing,
          analysis: analyzeListing(listing),
        })),
      [listingState],
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
          },
        );

        const data =
          (await response.json()) as ListingsApiResponse;

        if (!response.ok || !data.success) {
          throw new Error(
            data.error ??
              "Could not retrieve Etsy listings.",
          );
        }

        const receivedListings =
          data.listings ?? [];

        setListingState(receivedListings);
        setShop(data.shop ?? null);

        setCount(
          data.count ??
            receivedListings.length,
        );

        setTotalAvailable(
          data.totalAvailable ??
            data.count ??
            receivedListings.length,
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
    [],
  );

  const refreshListings =
    useCallback(async () => {
      await loadListings(true);
    }, [loadListings]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadListings();
  }, [loadListings]);

  const value =
    useMemo<ListingsContextValue>(
      () => ({
        listings: listingState,
        analyzedListings,
        shop,
        count,
        totalAvailable,
        isLoading,
        isRefreshing,
        error,
        searchQuery,
        setSearchQuery,
        refreshListings,
      }),
      [
        listingState,
        analyzedListings,
        shop,
        count,
        totalAvailable,
        isLoading,
        isRefreshing,
        error,
        searchQuery,
        refreshListings,
      ],
    );

  return (
    <ListingsContext.Provider value={value}>
      {children}
    </ListingsContext.Provider>
  );
}