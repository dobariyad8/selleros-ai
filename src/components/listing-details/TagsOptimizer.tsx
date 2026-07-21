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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tags className="size-5" />
          Tags
        </CardTitle>

        <CardDescription>
          Current keywords attached to the listing.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>

        <Button variant="outline" className="mt-4">
          Generate optimized tags
        </Button>
      </CardContent>
    </Card>
  );
}