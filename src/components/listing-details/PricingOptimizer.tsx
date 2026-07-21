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
    <Card>
      <CardHeader>
        <CardTitle>Pricing recommendation</CardTitle>

        <CardDescription>
          Review the suggested price adjustment.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">
              Current price
            </p>

            <p className="mt-2 text-2xl font-bold">
              ${currentPrice.toFixed(2)}
            </p>
          </div>

          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm text-muted-foreground">
              Recommended price
            </p>

            <p className="mt-2 text-2xl font-bold">
              ${recommendedPrice.toFixed(2)}
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          This recommendation is based on comparable mock listings
          and is not a guaranteed sales result.
        </p>

        <Button className="mt-4 w-full" onClick={onAccept} disabled={isApplied}>
          {isApplied ? "Recommended price applied" : "Accept recommended price"}
        </Button>
      </CardContent>
    </Card>
  );
}