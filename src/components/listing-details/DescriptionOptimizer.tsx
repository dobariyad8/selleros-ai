import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DescriptionOptimizerProps = {
  description: string;
};

export default function DescriptionOptimizer({
  description,
}: DescriptionOptimizerProps) {
  return (
    <Card className="h-full min-w-0">
      <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
        <CardTitle className="wrap-break-words text-base sm:text-lg">
          Description
        </CardTitle>

        <CardDescription className="wrap-break-words">
          Current listing description.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="min-w-0 rounded-xl border bg-muted/20 p-3 sm:p-4">
          <p className="whitespace-pre-wrap wrap-break-words text-sm leading-7 text-muted-foreground">
            {description ||
              "No description is currently available for this listing."}
          </p>
        </div>

        <Button
          variant="outline"
          className="mt-4 w-full sm:w-auto"
        >
          Generate improved description
        </Button>
      </CardContent>
    </Card>
  );
}