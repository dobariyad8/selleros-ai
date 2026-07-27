"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Trophy,
} from "lucide-react";

import { useListings } from "@/hooks/useListings";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import AIInsight from "@/components/dashboard/AIInsight";


export default function TopPerformers() {
  const {
    analyzedListings,
    isLoading,
  } = useListings();


  const topPerformers = useMemo(
    () =>
      [...analyzedListings]
        .sort(
          (a, b) =>
            b.analysis.scores.overall -
            a.analysis.scores.overall,
        )
        .slice(0, 5),
    [analyzedListings],
  );


  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          Loading top performers...
        </CardContent>
      </Card>
    );
  }


  return (
    <Card className="h-full min-w-0 transition-shadow hover:shadow-md">

      <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">

        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Trophy className="size-5" />
          Top Performers
        </CardTitle>

        <CardDescription>
          Your highest-scoring Etsy listings.
        </CardDescription>

      </CardHeader>


      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">

        {topPerformers.length > 0 ? (
          <div className="space-y-3">
            {topPerformers.map(
              ({ listing, analysis }, index) => (
                <div
                  key={listing.id}
                  className="rounded-xl border p-2.5"
                >
                  <div className="flex items-start gap-3">
            
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted font-bold">
                      {index + 1}
                    </div>
            
                    <div className="min-w-0 flex-1">
            
                      <p className="line-clamp-2 text-xs font-medium sm:text-sm">
                        {listing.title ||
                          "Untitled listing"}
                      </p>
                        
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge>
                          {analysis.scores.overall}/100
                        </Badge>
                        
                        <Badge variant="outline">
                          Tags {analysis.scores.tags}
                        </Badge>
                        
                        <Badge variant="outline">
                          Images {analysis.scores.images}
                        </Badge>
                      </div>
                        
                    </div>
                        
                  </div>
                </div>
              ),
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-5 text-center">
            <Trophy className="mx-auto size-8 text-muted-foreground" />
        
            <p className="mt-2 text-sm font-medium">
              No top performers yet
            </p>
        
            <p className="mt-1 text-xs text-muted-foreground">
              Connect Etsy listings to generate rankings.
            </p>
          </div>
        )}

        <AIInsight
          message={
            topPerformers.length > 0
              ? `Your top ${topPerformers.length} listings are performing strongly. Use their structure, keywords, and images as examples when improving weaker listings.`
              : "Connect listings to generate AI insights."
          }
        />


        <Button
          className="mt-4 w-full"
          variant="ghost"
          nativeButton={false}
          render={
            <Link href="/top-performers" />
          }
        >
          View all performers
          <ArrowRight className="size-4" />
        </Button>

        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          Top performers are ranked using SellerOS listing
          quality scores across titles, tags, descriptions,
          images, and pricing. High scores do not guarantee
          Etsy sales, traffic, or rankings.
        </p>


      </CardContent>

    </Card>
  );
}