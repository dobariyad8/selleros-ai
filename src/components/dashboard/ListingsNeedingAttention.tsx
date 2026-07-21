import {
  AlertTriangle,
  ArrowRight,
  ImageIcon,
  SearchCheck,
  Tags,
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
import Link from "next/link";

type ListingPriority = "High" | "Medium" | "Low";

type ListingAttention = {
  id: string;
  title: string;
  issue: string;
  score: number;
  priority: ListingPriority;
};

type ListingsNeedingAttentionProps = {
  listings: ListingAttention[];
};

function getPriorityVariant(priority: ListingPriority) {
  if (priority === "High") {
    return "destructive" as const;
  }

  if (priority === "Medium") {
    return "secondary" as const;
  }

  return "outline" as const;
}

function getIssueIcon(issue: string) {
  const normalizedIssue = issue.toLowerCase();

  if (
    normalizedIssue.includes("image") ||
    normalizedIssue.includes("photo") ||
    normalizedIssue.includes("dark")
  ) {
    return ImageIcon;
  }

  if (
    normalizedIssue.includes("tag") ||
    normalizedIssue.includes("keyword")
  ) {
    return Tags;
  }

  return SearchCheck;
}

export default function ListingsNeedingAttention({
  listings,
}: ListingsNeedingAttentionProps) {
  return (
    <Card className="h-full transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5" />
              AI Action Center
            </CardTitle>

            <CardDescription className="mt-1">
              Listings with the most important opportunities.
            </CardDescription>
          </div>

          <Badge variant="outline">
            {listings.length} actions
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {listings.map((listing) => {
            const IssueIcon = getIssueIcon(listing.issue);

            return (
              <div
                key={listing.id}
                className="group rounded-xl border p-4 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <IssueIcon className="size-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">
                          {listing.title}
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {listing.issue}
                        </p>
                      </div>

                      <Badge
                        variant={getPriorityVariant(
                          listing.priority
                        )}
                      >
                        {listing.priority}
                      </Badge>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Listing score
                        </p>

                        <p className="text-lg font-semibold">
                          {listing.score}
                          <span className="text-sm font-normal text-muted-foreground">
                            /100
                          </span>
                        </p>
                      </div>

                      <Button variant="outline" size="sm" nativeButton={false}
                      render = {
                        <Link href={'/listings/${listing.id}'} />
                      }
                      >
                        Review
                        <ArrowRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Button variant="ghost" className="mt-4 w-full">
          View all listings
          <ArrowRight className="size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}