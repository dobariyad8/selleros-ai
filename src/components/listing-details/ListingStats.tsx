import {
  BadgeDollarSign,
  Eye,
  PackageCheck,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import type { Listing } from "@/data/listings-data";

type ListingStatsProps = {
  listing: Listing;
};

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

  const scoreDetails = getScoreDetails(
    listing.score,
  );

  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <Card
            key={stat.label}
            className="min-w-0"
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
                <Icon className="size-4 shrink-0" />

                <span className="min-w-0 wrap-break-words text-sm">
                  {stat.label}
                </span>
              </div>

              <p className="mt-3 wrap-break-words text-xl font-bold sm:text-2xl">
                {stat.value}
              </p>
            </CardContent>
          </Card>
        );
      })}

      <Card className="min-w-0 overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <Sparkles className="size-4 shrink-0" />

              <span className="text-sm">
                AI score
              </span>
            </div>

            <Badge
              variant={scoreDetails.variant}
              className="w-fit shrink-0"
            >
              {scoreDetails.label}
            </Badge>
          </div>

          <div className="mt-4 flex items-end gap-2">
            <p className="wrap-break-words text-2xl font-bold transition-all sm:text-3xl">
              {listing.score}
            </p>

            <span className="pb-1 text-sm text-muted-foreground">
              /100
            </span>
          </div>

          <Progress
            value={listing.score}
            className="mt-4"
          />

          <p className="mt-3 wrap-break-words text-xs text-muted-foreground">
            Updates as recommendations are applied.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}