import { Tags } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type TagsOptimizerProps = {
  tags: string[];
};

export default function TagsOptimizer({
  tags,
}: TagsOptimizerProps) {
  return (
    <Card className="h-full min-w-0">
      <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
        <CardTitle className="flex min-w-0 items-center gap-2 text-base sm:text-lg">
          <Tags className="size-5 shrink-0" />

          <span className="wrap-break-words">
            Tags
          </span>
        </CardTitle>

        <CardDescription className="wrap-break-words">
          Current keywords attached to the listing.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
        {tags.length > 0 ? (
          <div className="flex min-w-0 flex-wrap gap-2">
            {tags.map((tag, index) => (
              <Badge
                key={`${tag}-${index}`}
                variant="secondary"
                className="max-w-full whitespace-normal wrap-break-words"
              >
                {tag}
              </Badge>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-4 text-center">
            <p className="text-sm font-medium">
              No tags available
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Generate optimized tags for this listing.
            </p>
          </div>
        )}

        <Button
          variant="outline"
          className="mt-4 w-full sm:w-auto"
        >
          Generate optimized tags
        </Button>
      </CardContent>
    </Card>
  );
}