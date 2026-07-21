"use client";

import { useContext } from "react";

import {
  ListingsContext,
  type ListingsContextValue,
} from "@/providers/ListingsProvider";

export function useListings(): ListingsContextValue {
  const context = useContext(ListingsContext);

  if (context === null) {
    throw new Error(
      "useListings must be used inside a ListingsProvider."
    );
  }

  return context;
}