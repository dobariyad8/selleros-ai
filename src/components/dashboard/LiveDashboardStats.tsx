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

import { calculateDescriptionScore } from "@/lib/scoring/descriptionScore";
import { calculateImageScore } from "@/lib/scoring/imageScore";
import { calculateOverallScore } from "@/lib/scoring/overallScore";
import { calculatePricingScore } from "@/lib/scoring/pricingScore";
import { calculateTagScore } from "@/lib/scoring/tagScore";
import { calculateTitleScore } from "@/lib/scoring/titleScore";

export default function LiveDashboardStats() {
  const {
    listings,
    totalAvailable,
    isLoading,
    error,
  } = useListings();

  const statistics = useMemo(() => {
    const activeListings = listings.filter(
      (listing) =>
        listing.status.toLowerCase() === "active",
    ).length;

    const listingScores = listings.map((listing) => {
      const titleResult = calculateTitleScore(
        listing.title,
      );

      const tagResult = calculateTagScore(
        listing.tags ?? [],
        listing.title,
      );

      const descriptionResult =
        calculateDescriptionScore(
          listing.description ?? "",
          listing.title,
        );

      const imageResult = calculateImageScore(
        listing.imageUrls ?? [],
      );

      const pricingResult = calculatePricingScore(
        Number(listing.price ?? 0),
      );

      return calculateOverallScore({
        title: titleResult.score,
        tags: tagResult.score,
        description: descriptionResult.score,
        images: imageResult.score,
        pricing: pricingResult.score,
      }).score;
    });

    const averageScore =
      listingScores.length > 0
        ? Math.round(
            listingScores.reduce(
              (total, score) => total + score,
              0,
            ) / listingScores.length,
          )
        : 0;

    const listingsNeedingAttention =
      listingScores.filter(
        (score) => score < 70,
      ).length;

    return {
      totalListings:
        totalAvailable || listings.length,
      activeListings,
      averageScore,
      listingsNeedingAttention,
    };
  }, [listings, totalAvailable]);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Dashboard statistics could not be loaded:
        {" "}
        {error}
      </div>
    );
  }

  const stats = [
    {
      title: "Total Listings",
      value: String(statistics.totalListings),
      description: "Connected Etsy listings",
      icon: Package,
    },
    {
      title: "Active Listings",
      value: String(statistics.activeListings),
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
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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