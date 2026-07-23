import AIRecommendations from "@/components/dashboard/AIRecommendations";

export default function RecommendationsPage() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4 lg:px-0">
      <div className="mb-4 min-w-0 sm:mb-6">
        <p className="text-sm text-muted-foreground">
          SellerOS Growth Tools
        </p>

        <h1 className="mt-2 wrap-break-words text-2xl font-bold tracking-tight sm:text-3xl">
          AI Recommendations
        </h1>

        <p className="mt-2 max-w-2xl wrap-break-words text-sm leading-6 text-muted-foreground sm:text-base">
          Review optimization opportunities generated
          from the scores of your connected Etsy
          listings.
        </p>
      </div>

      <div className="min-w-0">
        <AIRecommendations showAll />
      </div>
    </div>
  );
}