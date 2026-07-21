"use client";

import {
  BadgeDollarSign,
  Check,
  ImageIcon,
  Search,
  Sparkles,
  Tags,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type RecommendationPriority = "High" | "Medium" | "Low";

export type RecommendationType =
  | "Image"
  | "SEO"
  | "Tags"
  | "Pricing"
  | "Promotion";

export type WorkspaceRecommendation = {
  id: string;
  listingTitle: string;
  type: RecommendationType;
  title: string;
  reason: string;
  action: string;
  priority: RecommendationPriority;
};

type AIFixWorkspaceProps = {
  recommendation: WorkspaceRecommendation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function AIFixWorkspace({
  recommendation,
  open,
  onOpenChange,
}: AIFixWorkspaceProps) {
  if (!recommendation) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col overflow-y-auto sm:max-w-xl"
      >
        <SheetHeader className="border-b pb-5">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {recommendation.type === "Image" && <ImageIcon className="size-5" />}
              {recommendation.type === "SEO" && <Search className="size-5" />}
              {recommendation.type === "Tags" && <Tags className="size-5" />}
              {recommendation.type === "Pricing" && <BadgeDollarSign className="size-5" />}
              {recommendation.type === "Promotion" && <Sparkles className="size-5" />}
            </div>

            <Badge variant="outline">
              {recommendation.type}
            </Badge>

            <Badge
              variant={
                recommendation.priority === "High"
                  ? "destructive"
                  : "secondary"
              }
            >
              {recommendation.priority} priority
            </Badge>
          </div>

          <SheetTitle className="text-xl">
            {recommendation.title}
          </SheetTitle>

          <SheetDescription>
            {recommendation.listingTitle}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 px-4 py-5">
          <section className="rounded-xl border p-4">
            <p className="text-sm font-medium">Listing health</p>

            <div className="mt-3 flex items-end justify-between">
              <p className="text-3xl font-bold">
                62
                <span className="text-base font-normal text-muted-foreground">
                  /100
                </span>
              </p>

              <Badge variant="destructive">
                Needs improvement
              </Badge>
            </div>

            <Progress value={62} className="mt-3" />
          </section>

          <section className="rounded-xl border p-4">
            <p className="text-sm font-medium">Why this matters</p>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {recommendation.reason}
            </p>
          </section>

          <section className="rounded-xl border p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4" />
              <p className="text-sm font-medium">
                AI recommended change
              </p>
            </div>

            <p className="mt-3 text-sm leading-6">
              {recommendation.action}
            </p>
          </section>

          <section className="rounded-xl border p-4">
            <p className="text-sm font-medium">Estimated impact</p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">
                  Impact
                </p>
                <p className="mt-1 font-semibold">High</p>
              </div>

              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">
                  AI confidence
                </p>
                <p className="mt-1 font-semibold">91%</p>
              </div>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              These values are estimates and do not guarantee sales.
            </p>
          </section>

          <section className="rounded-xl border p-4">
            <p className="text-sm font-medium">Suggested result</p>

            <div className="mt-3 rounded-lg bg-muted/60 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3.5" />
                </div>

                <p className="text-sm leading-6">
                  {recommendation.action}
                </p>
              </div>
            </div>
          </section>
        </div>

        <SheetFooter className="sticky bottom-0 border-t bg-background px-4 py-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>

          <Button>
            <Sparkles className="size-4" />
            Apply AI change
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}