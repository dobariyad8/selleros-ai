import { Skeleton } from "@/components/ui/skeleton";

export default function ListingsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-40" />
          <Skeleton className="mt-2 h-5 w-64" />
        </div>

        <Skeleton className="h-10 w-32" />
      </div>

      <div className="mt-6 rounded-xl border p-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="mt-2 h-4 w-28" />
          </div>

          <Skeleton className="h-10 w-72" />
        </div>

        <div className="mt-8 space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-14 w-full"
            />
          ))}
        </div>
      </div>
    </div>
  );
}