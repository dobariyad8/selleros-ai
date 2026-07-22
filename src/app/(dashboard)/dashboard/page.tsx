import AIOpportunitySummary from "@/components/dashboard/AIOpportunitySummary";
import AIRecommendations from "@/components/dashboard/AIRecommendations";
import ListingsNeedingAttention from "@/components/dashboard/ListingsNeedingAttention";
import LiveDashboardStats from "@/components/dashboard/LiveDashboardStats";
import ShopHealthCard from "@/components/dashboard/ShopHealthCard";

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <AIOpportunitySummary />

      <div className="mt-6">
        <LiveDashboardStats />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ShopHealthCard />
        <ListingsNeedingAttention />
      </div>

      <div className="mt-6">
        <AIRecommendations />
      </div>
    </div>
  );
}