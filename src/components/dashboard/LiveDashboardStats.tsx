"use client";

import { useMemo } from "react";
import {
  CircleCheckBig,
  ClipboardCheck,
  Package,
  TriangleAlert,
} from "lucide-react";

import StatCard from "@/components/dashboard/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useListings } from "@/hooks/useListings";
import { calculateAverageScore } from "@/lib/scoring/analyzeListing";

export default function LiveDashboardStats() {
  const {
    listings,
    analyzedListings,
    totalAvailable,
    isLoading,
    error,
  } = useListings();

  const statistics = useMemo(() => {
    const activeListings = listings.filter(
      (listing) =>
        listing.status.toLowerCase() === "active",
    ).length;

    const listingScores = analyzedListings.map(
      ({ analysis }) =>
        analysis.scores.overall,
    );

    return {
      totalListings:
        totalAvailable ?? listings.length,
      activeListings,
      averageScore:
        calculateAverageScore(listingScores),
      listingsNeedingAttention:
        listingScores.filter(
          (score) => score < 70,
        ).length,
    };
  }, [
    listings,
    analyzedListings,
    totalAvailable,
  ]);

  if (isLoading) {
    return (
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map(
          (_, index) => (
            <Skeleton
              key={index}
              className="h-32 rounded-xl"
            />
          ),
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-w-0 wrap-break-words rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Dashboard statistics could not be loaded:{" "}
        {error}
      </div>
    );
  }

  const stats = [
    {
      title: "Total Listings",
      value: String(
        statistics.totalListings,
      ),
      description: "Connected Etsy listings",
      icon: Package,
    },
    {
      title: "Active Listings",
      value: String(
        statistics.activeListings,
      ),
      description: "Currently active on Etsy",
      icon: CircleCheckBig,
    },
    {
      title: "Average Health",
      value: `${statistics.averageScore}/100`,
      description:
        "Average SellerOS listing score",
      icon: ClipboardCheck,
    },
    {
      title: "Needs Attention",
      value: String(
        statistics.listingsNeedingAttention,
      ),
      description:
        "Listings scoring below 70",
      icon: TriangleAlert,
    },
  ];

  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
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
  );
}