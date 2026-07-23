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
    <Card className="h-full min-w-0">
      <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
        <CardTitle className="wrap-break-words text-base sm:text-lg">
          Title optimization
        </CardTitle>

        <CardDescription className="wrap-break-words">
          Compare the current title with the AI suggestion.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="min-w-0 rounded-xl border p-3 sm:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Current title
          </p>

          <p className="mt-2 wrap-break-words text-sm leading-6">
            {currentTitle}
          </p>
        </div>

        <div className="min-w-0 rounded-xl border border-primary/30 bg-primary/5 p-3 sm:p-4">
          <div className="flex min-w-0 items-center gap-2">
            <Sparkles className="size-4 shrink-0" />

            <p className="wrap-break-words text-xs font-medium uppercase tracking-wide">
              AI suggested title
            </p>
          </div>

          <p className="mt-2 wrap-break-words text-sm leading-6">
            {suggestedTitle}
          </p>
        </div>

        <Button
          className="w-full"
          onClick={onAccept}
          disabled={isApplied}
        >
          {isApplied ? "AI title applied" : "Accept AI title"}
        </Button>
      </CardContent>
    </Card>
  );
}