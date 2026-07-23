import ListingsTable from "@/components/listings/ListingsTable";

export default function ListingsPage() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-4 px-3 sm:space-y-6 sm:px-4 lg:px-0">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Listings
        </h1>

        <p className="mt-1 max-w-2xl wrap-break-words text-sm text-muted-foreground">
          Review, analyze, and optimize your connected Etsy
          listings.
        </p>
      </div>

      <div className="min-w-0">
        <ListingsTable />
      </div>
    </div>
  );
}