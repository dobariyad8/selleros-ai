"use client";

import Link from "next/link";
import {
  BadgeDollarSign,
  FileText,
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

type RecommendationPriority =
  | "High"
  | "Medium"
  | "Low";

export type RecommendationType =
  | "Image"
  | "SEO"
  | "Tags"
  | "Description"
  | "Pricing"
  | "Promotion";

export type WorkspaceRecommendation = {
  id: string;
  listingId?: string;
  listingTitle: string;
  listingScore?: number;
  categoryScore?: number;
  type: RecommendationType;
  title: string;
  reason: string;
  action: string;
  priority: RecommendationPriority;
};

type AIFixWorkspaceProps = {
  recommendation:
    | WorkspaceRecommendation
    | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function RecommendationIcon({
  type,
}: {
  type: RecommendationType;
}) {
  if (type === "Image") {
    return <ImageIcon className="size-5" />;
  }

  if (type === "SEO") {
    return <Search className="size-5" />;
  }

  if (type === "Tags") {
    return <Tags className="size-5" />;
  }

  if (type === "Description") {
    return <FileText className="size-5" />;
  }

  if (type === "Pricing") {
    return (
      <BadgeDollarSign className="size-5" />
    );
  }

  return <Sparkles className="size-5" />;
}

function getPriorityVariant(
  priority: RecommendationPriority,
) {
  if (priority === "High") {
    return "destructive" as const;
  }

  if (priority === "Medium") {
    return "secondary" as const;
  }

  return "outline" as const;
}

function getScoreLabel(score: number) {
  if (score >= 85) {
    return "Excellent";
  }

  if (score >= 70) {
    return "Needs attention";
  }

  return "Needs improvement";
}

function getScoreVariant(score: number) {
  if (score >= 85) {
    return "default" as const;
  }

  if (score >= 70) {
    return "secondary" as const;
  }

  return "destructive" as const;
}

export default function AIFixWorkspace({
  recommendation,
  open,
  onOpenChange,
}: AIFixWorkspaceProps) {
  if (!recommendation) {
    return null;
  }

  const hasListingScore =
    typeof recommendation.listingScore ===
    "number";

  const hasCategoryScore =
    typeof recommendation.categoryScore ===
    "number";

  const auditHref = recommendation.listingId
    ? `/audit/${recommendation.listingId}`
    : "/listings";

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="right"
        className="flex w-full flex-col overflow-y-auto sm:max-w-xl"
      >
        <SheetHeader className="border-b pb-5">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <RecommendationIcon
                type={recommendation.type}
              />
            </div>

            <Badge variant="outline">
              {recommendation.type}
            </Badge>

            <Badge
              variant={getPriorityVariant(
                recommendation.priority,
              )}
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
            <p className="text-sm font-medium">
              Listing health
            </p>

            {hasListingScore ? (
              <>
                <div className="mt-3 flex items-end justify-between gap-4">
                  <p className="text-3xl font-bold">
                    {recommendation.listingScore}

                    <span className="text-base font-normal text-muted-foreground">
                      /100
                    </span>
                  </p>

                  <Badge
                    variant={getScoreVariant(
                      recommendation.listingScore!,
                    )}
                  >
                    {getScoreLabel(
                      recommendation.listingScore!,
                    )}
                  </Badge>
                </div>

                <Progress
                  value={
                    recommendation.listingScore ?? null
                  }
                  className="mt-3"
                />
              </>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                A live listing score will appear
                after recommendations are connected
                to your listing analysis.
              </p>
            )}
          </section>

          <section className="rounded-xl border p-4">
            <p className="text-sm font-medium">
              Recommendation focus
            </p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">
                  Category
                </p>

                <p className="mt-1 font-semibold">
                  {recommendation.type}
                </p>
              </div>

              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">
                  Category score
                </p>

                <p className="mt-1 font-semibold">
                  {hasCategoryScore
                    ? `${recommendation.categoryScore}/100`
                    : "Not available"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border p-4">
            <p className="text-sm font-medium">
              Why this matters
            </p>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {recommendation.reason}
            </p>
          </section>

          <section className="rounded-xl border p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4" />

              <p className="text-sm font-medium">
                Recommended next step
              </p>
            </div>

            <p className="mt-3 text-sm leading-6">
              {recommendation.action}
            </p>
          </section>

          <p className="text-xs text-muted-foreground">
            Recommendations are SellerOS estimates
            based on listing content and do not
            guarantee Etsy traffic, rankings, or
            sales.
          </p>
        </div>

        <SheetFooter className="sticky bottom-0 border-t bg-background px-4 py-4">
          <Button
            variant="outline"
            onClick={() =>
              onOpenChange(false)
            }
          >
            Close
          </Button>

          <Button
            nativeButton={false}
            render={
              <Link
                href={auditHref}
                onClick={() =>
                  onOpenChange(false)
                }
              />
            }
          >
            <Sparkles className="size-4" />

            {recommendation.listingId
              ? "Open AI Audit"
              : "Open Listings"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}