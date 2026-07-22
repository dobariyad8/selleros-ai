import AIRecommendations from "@/components/dashboard/AIRecommendations";

export default function RecommendationsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          SellerOS Growth Tools
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          AI Recommendations
        </h1>

        <p className="mt-2 max-w-2xl text-muted-foreground">
          Review optimization opportunities generated
          from the scores of your connected Etsy
          listings.
        </p>
      </div>

      <AIRecommendations showAll />
    </div>
  );
}