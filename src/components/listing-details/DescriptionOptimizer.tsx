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
    <Card>
      <CardHeader>
        <CardTitle>Description</CardTitle>

        <CardDescription>
          Current listing description.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <p className="text-sm leading-7 text-muted-foreground">
          {description}
        </p>

        <Button variant="outline" className="mt-4">
          Generate improved description
        </Button>
      </CardContent>
    </Card>
  );
}