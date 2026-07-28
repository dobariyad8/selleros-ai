"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import AIOptimizeListingCard from "@/components/ai/AIOptimizeListingCard";
import AIRewriteCard from "@/components/ai/AIRewriteCard";
import AIDescriptionRewriteCard from "@/components/ai/AIDescriptionReWriteCard";
import AITagGeneratorCard from "@/components/ai/AITagGeneratorCard";
import CompleteOptimizationCard from "@/components/ai/CompleteOptimizationCard";
import AIImageGeneratorCard from "@/components/ai/AIImageGeneratorCard";

import type { SellerOsListing } from "@/lib/etsy/types";

import {
  useEffect,
  useState,
} from "react";


type OptimizedListing = {
  title: string;
  description: string;
  tags: string[];
};


type Props = {
  listing: SellerOsListing;
  focus: string | null;
  suggestedTitle: string;
  setSuggestedTitle: (
    value: string,
  ) => void;

  suggestedDescription: string;
  setSuggestedDescription: (
    value: string,
  ) => void;

  suggestedTags: string[];
  setSuggestedTags: (
    value: string[],
  ) => void;

  optimizationVersion: number;

  onOptimizationComplete: (
    listing: OptimizedListing,
  ) => void;
};


export default function OptimizationTabs({
  listing,
  focus,
  suggestedTitle,
  setSuggestedTitle,
  suggestedDescription,
  setSuggestedDescription,
  suggestedTags,
  setSuggestedTags,
  optimizationVersion,
  onOptimizationComplete,
}: Props) {

      const [activeTab, setActiveTab] =
    useState("full");

      useEffect(() => {
          if (
            focus === "title" ||
            focus === "description" ||
            focus === "tags" ||
  focus === "image"
          ) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setActiveTab(focus);
          }
        }, [focus]);


  return (
    <div className="min-w-0 rounded-xl border bg-card p-4 sm:p-6">

      <h2 className="mb-4 text-lg font-semibold">
        AI Optimization Center
      </h2>


      <Tabs
  value={activeTab}
  onValueChange={setActiveTab}
>

        <TabsList>
          <TabsTrigger value="full">
            Full Optimize
          </TabsTrigger>

          <TabsTrigger value="title">
            Title
          </TabsTrigger>

          <TabsTrigger value="description">
            Description
          </TabsTrigger>

          <TabsTrigger value="tags">
            Tags
          </TabsTrigger>

          <TabsTrigger value="image">
            Image
          </TabsTrigger>

        </TabsList>


        <div className="mt-5">

          <TabsContent value="full">
            <AIOptimizeListingCard
              currentTitle={listing.title}
              currentDescription={
                listing.description ?? ""
              }
              currentTags={
                listing.tags ?? []
              }
              onOptimizationComplete={
                onOptimizationComplete
              }
            />

            <div className="mt-5">
              <CompleteOptimizationCard
                currentTitle={listing.title}
                currentDescription={
                  listing.description ?? ""
                }
                currentTags={
                  listing.tags ?? []
                }
                suggestedTitle={
                  suggestedTitle
                }
                suggestedDescription={
                  suggestedDescription
                }
                suggestedTags={
                  suggestedTags
                }
              />
            </div>
          </TabsContent>


          <TabsContent value="title">
            <AIRewriteCard
              key={`title-${optimizationVersion}`}
              current={listing.title}
              suggested={suggestedTitle}
              onSuggestionChange={
                setSuggestedTitle
              }
            />
          </TabsContent>


          <TabsContent value="description">
            <AIDescriptionRewriteCard
              key={`description-${optimizationVersion}`}
              title={listing.title}
              current={
                listing.description ?? ""
              }
              suggested={
                suggestedDescription
              }
              onSuggestionChange={
                setSuggestedDescription
              }
            />
          </TabsContent>


          <TabsContent value="tags">
            <AITagGeneratorCard
              key={`tags-${optimizationVersion}`}
              title={listing.title}
              description={
                listing.description ?? ""
              }
              currentTags={
                listing.tags ?? []
              }
              suggested={
                suggestedTags
              }
              onSuggestionChange={
                setSuggestedTags
              }
            />
          </TabsContent>
          
          <TabsContent value="image">
            <AIImageGeneratorCard
              listing={listing}
            />
          </TabsContent>

        </div>

      </Tabs>

    </div>
  );
}