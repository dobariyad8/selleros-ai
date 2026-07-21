"use client";
import { useState } from "react";
import { LucideIcon } from "lucide-react";
import AIFixWorkspace, { type WorkspaceRecommendation, type RecommendationType, } from "./AIFixWorkspace";

import {
  ArrowRight,
  BadgeDollarSign,
  ImageIcon,
  Search,
  Sparkles,
  Tags,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type RecommendationPriority = "High" | "Medium" | "Low";

type AIRecommendation = {
  id: string;
  listingTitle: string;
  type: RecommendationType;
  title: string;
  reason: string;
  action: string;
  priority: RecommendationPriority;
};

type AIRecommendationsProps = {
  recommendations: AIRecommendation[];
};

function getPriorityVariant(priority: RecommendationPriority) {
  if (priority === "High") {
    return "destructive" as const;
  }

  if (priority === "Medium") {
    return "secondary" as const;
  }

  return "outline" as const;
}

function getRecommendationIcon(type: RecommendationType): LucideIcon {
  if (type === "Image") {
    return ImageIcon;
  }

  if (type === "SEO") {
    return Search;
  }

  if (type === "Tags") {
    return Tags;
  }

  if (type === "Pricing") {
    return BadgeDollarSign;
  }

  if (type === "Promotion") {
    return TrendingUp;
  }

  return Sparkles;
}



export default function AIRecommendations({
  recommendations,
}: AIRecommendationsProps) {
    const [selectedRecommendation, setSelectedRecommendation] =
  useState<WorkspaceRecommendation | null>(null);

const [workspaceOpen, setWorkspaceOpen] = useState(false);

function openWorkspace(
  recommendation: WorkspaceRecommendation
) {
  setSelectedRecommendation(recommendation);
  setWorkspaceOpen(true);
}
  const displayedRecommendations = recommendations.slice(0, 3);

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-5" />
              AI Recommendations
            </CardTitle>

            <CardDescription className="mt-1">
              Prioritized actions that may improve your listings.
            </CardDescription>
          </div>

          <Badge variant="outline">
            {recommendations.length} recommendations
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4 lg:grid-cols-3">
          {displayedRecommendations.map((recommendation) => {
            const RecommendationIcon =
              getRecommendationIcon(recommendation.type);

            return (
              <div
                key={recommendation.id}
                className="group flex h-full flex-col rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:bg-muted/30 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <RecommendationIcon className="size-5" />
                  </div>

                  <Badge
                    variant={getPriorityVariant(
                      recommendation.priority
                    )}
                  >
                    {recommendation.priority}
                  </Badge>
                </div>

                <div className="mt-4">
                  <Badge variant="outline">
                    {recommendation.type}
                  </Badge>

                  <h3 className="mt-3 font-semibold">
                    {recommendation.title}
                  </h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {recommendation.listingTitle}
                  </p>
                </div>

                <div className="mt-4 space-y-3 text-sm">
                  <div>
                    <p className="font-medium">Why it matters</p>

                    <p className="mt-1 line-clamp-2 text-muted-foreground">
                      {recommendation.reason}
                    </p>
                  </div>

                  <div>
                    <p className="font-medium">Recommended action</p>

                    <p className="mt-1 line-clamp-2 text-muted-foreground">
                      {recommendation.action}
                    </p>
                  </div>
                </div>

                <Button className="mt-auto pt-4" size="sm" onClick={() => openWorkspace(recommendation)}>
                  <Sparkles className="size-4" />
                  Fix with AI
                </Button>
              </div>
            );
          })}
        </div>

        {recommendations.length > 3 && (
          <Button variant="outline" className="mt-4 w-full">
            View all recommendations
            <ArrowRight className="size-4" />
          </Button>
        )}
      </CardContent>
      <AIFixWorkspace
  recommendation={selectedRecommendation}
  open={workspaceOpen}
  onOpenChange={setWorkspaceOpen}
/>
    </Card>
    
  );
}