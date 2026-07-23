"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ImageIcon,
  RefreshCw,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useListings } from "@/hooks/useListings";

function getStatusClasses(status: string) {
  switch (status.toLowerCase()) {
    case "active":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";

    case "draft":
      return "bg-amber-50 text-amber-700 ring-amber-600/20";

    case "inactive":
      return "bg-slate-100 text-slate-700 ring-slate-600/20";

    case "sold_out":
      return "bg-red-50 text-red-700 ring-red-600/20";

    default:
      return "bg-muted text-muted-foreground ring-border";
  }
}

export default function ListingsTable() {
  const {
    listings,
    isLoading,
    isRefreshing,
    error,
    refreshListings,
  } = useListings();

  const router = useRouter();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");
  const [sortBy, setSortBy] =
    useState("title-asc");
  const [currentPage, setCurrentPage] =
    useState(1);

  const listingsPerPage = 10;

  const filteredListings = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = listings.filter(
      (listing) => {
        const matchesSearch =
          query === "" ||
          listing.title
            .toLowerCase()
            .includes(query) ||
          listing.tags.some((tag) =>
            tag.toLowerCase().includes(query),
          );

        const matchesStatus =
          statusFilter === "all" ||
          listing.status === statusFilter;

        return matchesSearch && matchesStatus;
      },
    );

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "title-desc":
          return b.title.localeCompare(a.title);

        case "price-asc":
          return a.price - b.price;

        case "price-desc":
          return b.price - a.price;

        case "title-asc":
        default:
          return a.title.localeCompare(b.title);
      }
    });
  }, [
    listings,
    search,
    statusFilter,
    sortBy,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredListings.length /
        listingsPerPage,
    ),
  );

  const paginatedListings = useMemo(() => {
    const startIndex =
      (currentPage - 1) * listingsPerPage;

    return filteredListings.slice(
      startIndex,
      startIndex + listingsPerPage,
    );
  }, [filteredListings, currentPage]);

  const startListing =
    filteredListings.length === 0
      ? 0
      : (currentPage - 1) *
          listingsPerPage +
        1;

  const endListing = Math.min(
    currentPage * listingsPerPage,
    filteredListings.length,
  );

  if (isLoading) {
    return (
      <div className="min-w-0 rounded-xl border bg-card p-6 text-center sm:p-8">
        <p className="text-sm text-muted-foreground">
          Loading your Etsy listings...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-w-0 rounded-xl border border-red-200 bg-red-50 p-5 sm:p-8">
        <p className="font-semibold text-red-700">
          Could not load Etsy listings
        </p>

        <p className="mt-2 wrap-break-words text-sm text-red-600">
          {error}
        </p>

        <Button
          type="button"
          variant="outline"
          className="mt-4 w-full sm:w-auto"
          onClick={() =>
            void refreshListings()
          }
        >
          Try again
        </Button>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="min-w-0 rounded-xl border bg-card p-6 text-center sm:p-10">
        <h2 className="text-lg font-semibold">
          No listings found
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Connect your Etsy shop or import a CSV
          file to begin.
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border bg-card">
      <div className="border-b p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h2 className="font-semibold">
              Etsy listings
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {filteredListings.length === 0
                ? "No listings found"
                : `Showing ${startListing}–${endListing} of ${filteredListings.length} listings`}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full shrink-0 sm:w-auto"
            disabled={isRefreshing}
            onClick={() =>
              void refreshListings()
            }
          >
            <RefreshCw
              className={
                isRefreshing
                  ? "size-4 animate-spin"
                  : "size-4"
              }
            />

            {isRefreshing
              ? "Refreshing..."
              : "Refresh"}
          </Button>
        </div>

        <div className="mt-4 grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
          <div className="relative min-w-0">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <input
              type="text"
              placeholder="Search listings..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
              className="w-full min-w-0 rounded-md border bg-background py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid gap-1.5 sm:grid-cols-[auto_1fr] sm:items-center">
            <label
              htmlFor="status-filter"
              className="text-sm font-medium"
            >
              Status
            </label>

            <select
              id="status-filter"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(
                  event.target.value,
                );
                setCurrentPage(1);
              }}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:w-auto"
            >
              <option value="all">All</option>
              <option value="active">
                Active
              </option>
              <option value="draft">
                Draft
              </option>
              <option value="inactive">
                Inactive
              </option>
              <option value="sold_out">
                Sold Out
              </option>
            </select>
          </div>

          <div className="grid gap-1.5 sm:grid-cols-[auto_1fr] sm:items-center">
            <label
              htmlFor="sort-by"
              className="text-sm font-medium"
            >
              Sort
            </label>

            <select
              id="sort-by"
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:w-auto"
            >
              <option value="title-asc">
                Title (A–Z)
              </option>
              <option value="title-desc">
                Title (Z–A)
              </option>
              <option value="price-asc">
                Price (Low → High)
              </option>
              <option value="price-desc">
                Price (High → Low)
              </option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {paginatedListings.length > 0 ? (
          paginatedListings.map((listing) => (
            <article
              key={listing.id}
              className="min-w-0 rounded-xl border p-3"
            >
              <div className="flex min-w-0 gap-3">
                <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                  {listing.imageUrls.length >
                  0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={
                        listing.imageUrls[0]
                      }
                      alt={
                        listing.title ||
                        "Etsy listing"
                      }
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="size-5 text-muted-foreground" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 wrap-break-words font-medium">
                    {listing.title ||
                      "Untitled listing"}
                  </p>

                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    Etsy ID: {listing.listingId}
                  </p>

                  <span
                    className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${getStatusClasses(
                      listing.status,
                    )}`}
                  >
                    {listing.status.replaceAll(
                      "_",
                      " ",
                    )}
                  </span>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-muted/30 p-3">
                <div>
                  <dt className="text-xs text-muted-foreground">
                    Price
                  </dt>

                  <dd className="mt-1 wrap-break-words text-sm font-medium">
                    {listing.currencyCode}{" "}
                    {listing.price.toFixed(2)}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-muted-foreground">
                    Quantity
                  </dt>

                  <dd className="mt-1 text-sm font-medium">
                    {listing.quantity}
                  </dd>
                </div>
              </dl>

              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3 w-full"
                onClick={() => {
                  router.push(
                    `/audit/${listing.id}`,
                  );
                }}
              >
                Audit listing
              </Button>
            </article>
          ))
        ) : (
          <div className="rounded-xl border border-dashed p-5 text-center">
            <p className="font-medium">
              No matching listings
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Try changing your search or filter.
            </p>
          </div>
        )}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-190">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="w-20 px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Image
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Listing
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Price
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Quantity
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Status
              </th>

              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {paginatedListings.map(
              (listing) => (
                <tr
                  key={listing.id}
                  className="border-b last:border-b-0 hover:bg-muted/30"
                >
                  <td className="px-6 py-4">
                    <div className="flex size-12 items-center justify-center overflow-hidden rounded-md border bg-muted">
                      {listing.imageUrls.length >
                      0 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={
                            listing
                              .imageUrls[0]
                          }
                          alt={
                            listing.title ||
                            "Etsy listing"
                          }
                          loading="lazy"
                          className="size-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="size-4 text-muted-foreground" />
                      )}
                    </div>
                  </td>

                  <td className="max-w-xl px-6 py-4">
                    <p className="truncate font-medium">
                      {listing.title ||
                        "Untitled listing"}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Etsy ID:{" "}
                      {listing.listingId}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    {listing.currencyCode}{" "}
                    {listing.price.toFixed(2)}
                  </td>

                  <td className="px-6 py-4 text-sm">
                    {listing.quantity}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${getStatusClasses(
                        listing.status,
                      )}`}
                    >
                      {listing.status.replaceAll(
                        "_",
                        " ",
                      )}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        router.push(
                          `/audit/${listing.id}`,
                        );
                      }}
                    >
                      Audit
                    </Button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </p>

        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            disabled={currentPage === 1}
            onClick={() =>
              setCurrentPage((page) =>
                Math.max(1, page - 1),
              )
            }
          >
            Previous
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            disabled={
              currentPage === totalPages ||
              filteredListings.length === 0
            }
            onClick={() =>
              setCurrentPage((page) =>
                Math.min(
                  totalPages,
                  page + 1,
                ),
              )
            }
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}