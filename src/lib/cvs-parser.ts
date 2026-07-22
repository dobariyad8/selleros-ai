import Papa from "papaparse";

import type { SellerOsListing } from "@/lib/etsy/types";

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
  return Array.from(
    { length: 10 },
    (_, index) =>
      row[`IMAGE${index + 1}`]?.trim(),
  ).filter(
    (url): url is string => Boolean(url),
  );
}

function getFirstValue(
  row: EtsyCSVRow,
  keys: string[],
) {
  for (const key of keys) {
    const value = row[key]?.trim();

    if (value) {
      return value;
    }
  }

  return undefined;
}

function parseNumber(
  value: string | undefined,
  fallback = 0,
) {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue)
    ? parsedValue
    : fallback;
}

export function parseEtsyCSV(
  file: File,
): Promise<SellerOsListing[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<EtsyCSVRow>(file, {
      header: true,
      skipEmptyLines: true,

      transformHeader: (header) =>
        header.trim().toUpperCase(),

      complete(results) {
        try {
          const listings: SellerOsListing[] =
            results.data.map((row, index) => {
              const importedListingId =
                parseNumber(
                  getFirstValue(row, [
                    "LISTING_ID",
                    "LISTING ID",
                    "LISTINGID",
                  ]),
                  -(index + 1),
                );

              const sku =
                row["SKU"]?.trim();

              const title =
                row["TITLE"]?.trim() ?? "";

              const price = parseNumber(
                row["PRICE"],
              );

              const quantity = parseNumber(
                row["QUANTITY"],
              );

              const taxonomyIdValue =
                getFirstValue(row, [
                  "TAXONOMY_ID",
                  "TAXONOMY ID",
                  "TAXONOMYID",
                ]);

              const taxonomyId =
                taxonomyIdValue !== undefined
                  ? parseNumber(
                      taxonomyIdValue,
                    )
                  : null;

              const listingUrl =
                getFirstValue(row, [
                  "LISTING_URL",
                  "LISTING URL",
                  "URL",
                ]) ?? null;

              return {
                id:
                  sku ||
                  `csv-import-${Math.abs(
                    importedListingId,
                  )}-${index + 1}`,

                listingId: importedListingId,

                title,

                description:
                  row["DESCRIPTION"]?.trim() ??
                  "",

                price,

                currencyCode:
                  getFirstValue(row, [
                    "CURRENCY_CODE",
                    "CURRENCY CODE",
                    "CURRENCY",
                  ]) ?? "USD",

                quantity,

                tags: splitCSVValue(
                  row["TAGS"],
                ),

                materials: splitCSVValue(
                  row["MATERIALS"],
                ),

                imageUrls:
                  getImageUrls(row),

                status:
                  row["STATUS"]?.trim() ||
                  row["STATE"]?.trim() ||
                  "active",

                taxonomyId,

                listingUrl,

                source: "csv-import",
              };
            });

          resolve(listings);
        } catch (error) {
          reject(
            error instanceof Error
              ? error
              : new Error(
                  "Failed to parse Etsy CSV.",
                ),
          );
        }
      },

      error(error) {
        reject(error);
      },
    });
  });
}