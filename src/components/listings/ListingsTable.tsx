"use client";

import { RefreshCw, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useListings } from "@/hooks/useListings";
import { useRouter } from "next/navigation";

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
    count,
    isLoading,
    isRefreshing,
    error,
    refreshListings,
  } = useListings();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("title-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const listingsPerPage = 10;
  const router = useRouter();

  const filteredListings = useMemo(() => {
  const query = search.trim().toLowerCase();

  const filtered = listings.filter((listing) => {
    const matchesSearch =
      query === "" ||
      listing.title.toLowerCase().includes(query) ||
      listing.tags.some((tag) =>
        tag.toLowerCase().includes(query)
      );

    const matchesStatus =
      statusFilter === "all" ||
      listing.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return filtered.sort((a, b) => {
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
    }, [listings, search, statusFilter, sortBy]);

    const totalPages = Math.max(
      1,
      Math.ceil(filteredListings.length / listingsPerPage)
    );

    const paginatedListings = useMemo(() => {
      const startIndex = (currentPage - 1) * listingsPerPage;
      const endIndex = startIndex + listingsPerPage;

      return filteredListings.slice(startIndex, endIndex);
    }, [filteredListings, currentPage]);

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Loading your Etsy listings...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8">
        <p className="font-semibold text-red-700">
          Could not load Etsy listings
        </p>

        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>

        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => void refreshListings()}
        >
          Try again
        </Button>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center">
        <h2 className="text-lg font-semibold">
          No listings found
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Connect your Etsy shop or import a CSV file to begin.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center justify-between gap-4 border-b px-6 py-4">
        <div>
          <h2 className="font-semibold">
            Etsy listings
          </h2>
          <div className="border-b px-6 py-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <input
              type="text"
              placeholder="Search listings..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-md border bg-background py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
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
              setStatusFilter(event.target.value);
              setCurrentPage(1);
            }}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="all">All</option>
        
            <option value="active">Active</option>
        
            <option value="draft">Draft</option>
        
            <option value="inactive">Inactive</option>
        
            <option value="sold_out">Sold Out</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
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
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="title-asc">Title (A–Z)</option>
            <option value="title-desc">Title (Z–A)</option>
            <option value="price-asc">Price (Low → High)</option>
            <option value="price-desc">Price (High → Low)</option>
          </select>
        </div>

          <p className="text-sm text-muted-foreground">
            {filteredListings.length === 0
              ? "No listings found"
              : `Showing ${
                  (currentPage - 1) * listingsPerPage + 1
                }–${Math.min(
                  currentPage * listingsPerPage,
                  filteredListings.length
                )} of ${filteredListings.length} listings`}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isRefreshing}
          onClick={() => void refreshListings()}
        >
          <RefreshCw
            className={
              isRefreshing
                ? "size-4 animate-spin"
                : "size-4"
            }
          />

          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      

      <div className="overflow-x-auto">
        <table className="w-full min-w-190">
          <thead className="border-b bg-muted/40">
            <tr>
                <th className="w-20 px-6 py-3 text-left text-xs font-medium uppercase tracking-wide test-muted-foregroung">
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
            {paginatedListings.map((listing) => (
              <tr
                key={listing.id}
                className="border-b last:border-b-0 hover:bg-muted/30"
              >
                <td className="px-6 py-4">
                  <div className="flex size-12 items-center justify-center overflow-hidden rounded-md border bg-muted">
                    {listing.imageUrls.length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={listing.imageUrls[0]}
                        alt={listing.title || "Etsy listing"}
                        loading="lazy"
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] text-muted-foreground">
                        No image
                      </span>
                    )}
                  </div>
                </td>
                <td className="max-w-xl px-6 py-4">
                  <p className="truncate font-medium">
                    {listing.title || "Untitled listing"}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Etsy ID: {listing.listingId}
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
                      listing.status
                    )}`}
                  >
                    {listing.status.replaceAll("_", " ")}
                  </span>
                </td>

                <td className="px-6 py-4 text-right">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      router.push(`/audit/${listing.id}`);
                    }}
                  >
                    Audit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() =>
                setCurrentPage((page) => Math.max(1, page - 1))
              }
            >
              Previous
            </Button>
          
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={
                currentPage === totalPages ||
                filteredListings.length === 0
              }
              onClick={() =>
                setCurrentPage((page) =>
                  Math.min(totalPages, page + 1)
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