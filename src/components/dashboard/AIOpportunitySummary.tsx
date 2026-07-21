import {
  ArrowRight,
  CircleDollarSign,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

type AIOpportunitySummaryProps = {
  sellerName: string;
  highPriorityCount: number;
  potentialRevenue: number;
  confidence: number;
};

export default function AIOpportunitySummary({
  sellerName,
  highPriorityCount,
  potentialRevenue,
  confidence,
}: AIOpportunitySummaryProps) {
  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background">
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-2xl">
            <Badge variant="outline" className="mb-4 gap-2">
              <Sparkles className="size-3.5" />
              Today&apos;s AI opportunities
            </Badge>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Welcome back, {sellerName}
            </h1>

            <p className="mt-2 text-muted-foreground">
              SellerOS AI found {highPriorityCount} high-priority actions
              that may improve your shop performance.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button>
                Review recommendations
                <ArrowRight className="size-4" />
              </Button>

              <Button variant="outline">
                View shop report
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[520px]">
            <div className="rounded-xl border bg-background/80 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CircleDollarSign className="size-4" />
                <span className="text-sm">Potential revenue</span>
              </div>

              <p className="mt-3 text-2xl font-bold">
                +${potentialRevenue}
                <span className="text-sm font-normal text-muted-foreground">
                  /month
                </span>
              </p>
            </div>

            <div className="rounded-xl border bg-background/80 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="size-4" />
                <span className="text-sm">High priority</span>
              </div>

              <p className="mt-3 text-2xl font-bold">
                {highPriorityCount}
              </p>
            </div>

            <div className="rounded-xl border bg-background/80 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Sparkles className="size-4" />
                <span className="text-sm">AI confidence</span>
              </div>

              <p className="mt-3 text-2xl font-bold">
                {confidence}%
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}