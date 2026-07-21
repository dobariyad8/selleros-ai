import ListingsTable from "@/components/listings/ListingsTable";

export default function ListingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Listings
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Review, analyze, and optimize your connected Etsy
          listings.
        </p>
      </div>

      <ListingsTable />
    </div>
  );
}