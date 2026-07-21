import { Skeleton } from "@/components/ui/skeleton";

export default function ListingDetailsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <Skeleton className="h-5 w-32" />

      <div className="mt-5 flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-72" />
          <Skeleton className="mt-3 h-5 w-24" />
        </div>

        <Skeleton className="h-10 w-44" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-32 rounded-xl"
          />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border p-6"
          >
            <Skeleton className="h-6 w-44" />
            <Skeleton className="mt-2 h-4 w-64" />

            <Skeleton className="mt-6 h-20 w-full" />
            <Skeleton className="mt-4 h-20 w-full" />
            <Skeleton className="mt-4 h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}