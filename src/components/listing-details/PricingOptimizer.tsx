import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PricingOptimizerProps = {
  currentPrice: number;
  recommendedPrice: number;
  onAccept: () => void;
  isApplied: boolean;
};

export default function PricingOptimizer({
  currentPrice,
  recommendedPrice,
  onAccept,
  isApplied,
}: PricingOptimizerProps) {
  return (
    <Card className="h-full min-w-0">
      <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
        <CardTitle className="wrap-break-words text-base sm:text-lg">
          Pricing recommendation
        </CardTitle>

        <CardDescription className="wrap-break-words">
          Review the suggested price adjustment.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <div className="min-w-0 rounded-xl border p-3 sm:p-4">
            <p className="text-sm text-muted-foreground">
              Current price
            </p>

            <p className="mt-2 wrap-break-words text-xl font-bold sm:text-2xl">
              ${currentPrice.toFixed(2)}
            </p>
          </div>

          <div className="min-w-0 rounded-xl border border-primary/30 bg-primary/5 p-3 sm:p-4">
            <p className="text-sm text-muted-foreground">
              Recommended price
            </p>

            <p className="mt-2 wrap-break-words text-xl font-bold sm:text-2xl">
              ${recommendedPrice.toFixed(2)}
            </p>
          </div>
        </div>

        <p className="mt-4 wrap-break-words text-sm leading-6 text-muted-foreground">
          This recommendation is based on comparable mock listings
          and is not a guaranteed sales result.
        </p>

        <Button
          className="mt-4 w-full"
          onClick={onAccept}
          disabled={isApplied}
        >
          {isApplied
            ? "Recommended price applied"
            : "Accept recommended price"}
        </Button>
      </CardContent>
    </Card>
  );
}