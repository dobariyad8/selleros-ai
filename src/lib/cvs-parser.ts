import Papa from "papaparse";

import type { EtsyListing } from "./etsy-types";

type EtsyCSVRow = Record<string, string | undefined>;

function splitCSVValue(value?: string) {
  return (
    value
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean) ?? []
  );
}

function getImageUrls(row: EtsyCSVRow) {
  return Array.from({ length: 10 }, (_, index) => {
    return row[`IMAGE${index + 1}`]?.trim();
  }).filter((url): url is string => Boolean(url));
}

export function parseEtsyCSV(
  file: File
): Promise<EtsyListing[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<EtsyCSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toUpperCase(),

      complete(results) {
        try {
          const listings: EtsyListing[] = results.data.map(
            (row, index) => {
              const title = row["TITLE"]?.trim() ?? "";
              const price = Number(row["PRICE"] ?? 0);
              const quantity = Number(row["QUANTITY"] ?? 0);

              return {
                id:
                  row["SKU"]?.trim() ||
                  `imported-listing-${index + 1}`,

                title,

                description:
                  row["DESCRIPTION"]?.trim() ?? "",

                price:
                  Number.isFinite(price) ? price : 0,

                quantity:
                  Number.isFinite(quantity) ? quantity : 0,

                category: "Uncategorized",

                materials: splitCSVValue(
                  row["MATERIALS"]
                ),

                tags: splitCSVValue(row["TAGS"]),

                imageUrls: getImageUrls(row),

                views: 0,

                favorites: 0,

                orders: 0,

                revenue: 0,

                conversionRate: 0,

                status: "Active",

                listingUrl: undefined,

                createdAt: undefined,

                updatedAt: undefined,
              };
            }
          );

          resolve(listings);
        } catch (error) {
          reject(
            error instanceof Error
              ? error
              : new Error("Failed to parse Etsy CSV")
          );
        }
      },

      error(error) {
        reject(error);
      },
    });
  });
}