import StatCard from "@/components/dashboard/StatCard";
import ShopHealthCard from "@/components/dashboard/ShopHealthCard";
import { healthScores, listingsNeedingAttention, aiRecommendations } from "@/data/dashboard-data";
import ListingsNeedingAttention from "@/components/dashboard/ListingsNeedingAttention";
import AIRecommendations from "@/components/dashboard/AIRecommendations";
import AIOpportunitySummary from "@/components/dashboard/AIOpportunitySummary";
import {
  BadgeDollarSign,
  ClipboardCheck,
  Package,
  ShoppingBag,
} from "lucide-react"

const stats = [
  {
    title: "Total Listings",
    value: "85",
    description: "3 added this month",
    icon: Package,
  },
  {
    title: "AI Score",
    value: "92%",
    description: "Up 4 points this week",
    icon: ClipboardCheck,
  },
  {
    title: "Orders Today",
    value: "14",
    description: "6 more than yesterday",
    icon: ShoppingBag,
  },
  {
    title: "Revenue",
    value: "$312",
    description: "Today’s estimated revenue",
    icon: BadgeDollarSign,
  },
];

export default function Home() {
  return (
       <div className="mx-auto w-full max-w-7x1">

          <AIOpportunitySummary 
            sellerName="Dhruv"
            highPriorityCount={3}
            potentialRevenue={186}
            confidence={91}/>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <StatCard
                key={stat.title}
                title={stat.title}
                value={stat.value}
                description={stat.description}
                icon={stat.icon}
              />
            ))}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <ShopHealthCard
              overallScore={82}
              scores={healthScores}
            />

              <ListingsNeedingAttention listings={listingsNeedingAttention} />
            
          </div>
          <div className="mt-6">
            <AIRecommendations recommendations={aiRecommendations} />
          </div>
        </div>
  );
}
