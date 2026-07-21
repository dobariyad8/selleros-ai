import {
  BadgeDollarSign,
  Eye,
  PackageCheck,
  Sparkles,
} from "lucide-react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import type { Listing } from "@/data/listings-data";
import { Badge } from "@/components/ui/badge";

type ListingStatsProps = {
  listing: Listing;
};

export default function ListingStats({
  listing,
}: ListingStatsProps) {
  const stats = [
    {
      label: "Views",
      value: listing.views.toString(),
      icon: Eye,
    },
    {
      label: "Orders",
      value: listing.orders.toString(),
      icon: PackageCheck,
    },
    {
      label: "Current price",
      value: `$${listing.price.toFixed(2)}`,
      icon: BadgeDollarSign,
    },
  ];

  const scoreDetails = getScoreDetails(listing.score);

  function getScoreDetails(score: number) {
  if (score >= 90) {
    return {
      label: "Excellent",
      variant: "default" as const,
    };
  }

  if (score >= 75) {
    return {
      label: "Healthy",
      variant: "secondary" as const,
    };
  }

  if (score >= 60) {
    return {
      label: "Needs attention",
      variant: "outline" as const,
    };
  }

  return {
    label: "Critical",
    variant: "destructive" as const,
  };
}

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="size-4" />
                <span className="text-sm">{stat.label}</span>
              </div>

              <p className="mt-3 text-2xl font-bold">
                {stat.value}
              </p>
            </CardContent>
          </Card>
        );
      })}

      <Card className="overflow-hidden">
  <CardContent className="p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Sparkles className="size-4" />
        <span className="text-sm">AI score</span>
      </div>

      <Badge variant={scoreDetails.variant}>
        {scoreDetails.label}
      </Badge>
    </div>

    <div className="mt-4 flex items-end gap-2">
      <p className="text-3xl font-bold transition-all">
        {listing.score}
      </p>

      <span className="pb-1 text-sm text-muted-foreground">
        /100
      </span>
    </div>

    <Progress value={listing.score} className="mt-4" />

    <p className="mt-3 text-xs text-muted-foreground">
      Updates as recommendations are applied.
    </p>
  </CardContent>
</Card>
    </div>
  );
}