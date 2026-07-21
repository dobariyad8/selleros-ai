import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type TitleOptimizerProps = {
  currentTitle: string;
  suggestedTitle: string;
  onAccept: () => void;
  isApplied: boolean;
};

export default function TitleOptimizer({
  currentTitle,
  suggestedTitle,
  onAccept,
  isApplied,
}: TitleOptimizerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Title optimization</CardTitle>

        <CardDescription>
          Compare the current title with the AI suggestion.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-xl border p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Current title
          </p>

          <p className="mt-2 text-sm leading-6">
            {currentTitle}
          </p>
        </div>

        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4" />

            <p className="text-xs font-medium uppercase tracking-wide">
              AI suggested title
            </p>
          </div>

          <p className="mt-2 text-sm leading-6">
            {suggestedTitle}
          </p>
        </div>

        <Button className="w-full" onClick={onAccept} disabled={isApplied}>
          Accept AI title
        </Button>
      </CardContent>
    </Card>
  );
}