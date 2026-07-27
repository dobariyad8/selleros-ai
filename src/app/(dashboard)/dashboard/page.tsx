import AIOpportunitySummary from "@/components/dashboard/AIOpportunitySummary";
import AIRecommendations from "@/components/dashboard/AIRecommendations";
import ListingsNeedingAttention from "@/components/dashboard/ListingsNeedingAttention";
import LiveDashboardStats from "@/components/dashboard/LiveDashboardStats";
import ShopHealthCard from "@/components/dashboard/ShopHealthCard";
import TopPerformers from "@/components/dashboard/TopPerformers";

export default function DashboardPage() {
  return (
    <div className="mx-auto min-w-0 w-full max-w-7xl px-3 sm:px-4 lg:px-0">
      <div className="min-w-0">
        <AIOpportunitySummary />
      </div>

      <div className="mt-4 min-w-0 sm:mt-6">
        <LiveDashboardStats />
      </div>

      <div className="mt-4 grid min-w-0 gap-4 sm:mt-6 sm:gap-6 xl:grid-cols-3">
        <div className="min-w-0">
          <ShopHealthCard />
        </div>

        <div className="min-w-0">
          <ListingsNeedingAttention />
        </div>

        <div className="min-w-0">
          <TopPerformers />
        </div>
      </div>

      <div className="mt-4 min-w-0 sm:mt-6">
        <AIRecommendations />
      </div>
    </div>
  );
}