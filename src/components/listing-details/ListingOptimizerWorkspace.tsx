"use client";

import { useState } from "react";
import { toast } from "sonner";

import DescriptionOptimizer from "@/components/listing-details/DescriptionOptimizer";
import ListingStats from "@/components/listing-details/ListingStats";
import PricingOptimizer from "@/components/listing-details/PricingOptimizer";
import TagsOptimizer from "@/components/listing-details/TagsOptimizer";
import TitleOptimizer from "@/components/listing-details/TitleOptimizer";
import ApplyAllFixesButton from "./ApplyAllFixesButton";
import ImageOptimizer from "./ImageOptimizer";

import type { Listing } from "@/data/listings-data";

type ListingOptimizerWorkspaceProps = {
  listing: Listing;
};

export default function ListingOptimizerWorkspace({
  listing,
}: ListingOptimizerWorkspaceProps) {
  const [currentTitle, setCurrentTitle] = useState(
    listing.currentTitle,
  );

  const [imageApplied, setImageApplied] =
    useState(false);

  const [currentPrice, setCurrentPrice] =
    useState(listing.price);

  const [
    descriptionApplied,
    setDescriptionApplied,
  ] = useState(false);

  const [tagsApplied, setTagsApplied] =
    useState(false);

  const [score, setScore] = useState(
    listing.score,
  );

  const everythingApplied =
    currentTitle === listing.suggestedTitle &&
    currentPrice === listing.recommendedPrice &&
    descriptionApplied &&
    tagsApplied &&
    imageApplied;

  function applyAllFixes() {
    const titleWasPending =
      currentTitle !== listing.suggestedTitle;

    const priceWasPending =
      currentPrice !== listing.recommendedPrice;

    let scoreIncrease = 0;

    if (titleWasPending) {
      scoreIncrease += 8;
    }

    if (priceWasPending) {
      scoreIncrease += 5;
    }

    if (!descriptionApplied) {
      scoreIncrease += 5;
    }

    if (!tagsApplied) {
      scoreIncrease += 5;
    }

    if (!imageApplied) {
      scoreIncrease += 7;
    }

    setCurrentTitle(listing.suggestedTitle);
    setCurrentPrice(listing.recommendedPrice);
    setDescriptionApplied(true);
    setTagsApplied(true);
    setImageApplied(true);

    setScore((currentScore) =>
      Math.min(
        currentScore + scoreIncrease,
        100,
      ),
    );

    toast.success("All AI fixes applied", {
      description: `Image, title, price, description, and tags were updated. Score increased by ${scoreIncrease} points.`,
    });
  }

  function acceptTitle() {
    if (
      currentTitle === listing.suggestedTitle
    ) {
      return;
    }

    setCurrentTitle(listing.suggestedTitle);

    setScore((currentScore) =>
      Math.min(currentScore + 8, 100),
    );

    toast.success("AI title applied", {
      description:
        "The listing score increased by 8 points.",
    });
  }

  function acceptPrice() {
    if (
      currentPrice === listing.recommendedPrice
    ) {
      return;
    }

    setCurrentPrice(
      listing.recommendedPrice,
    );

    setScore((currentScore) =>
      Math.min(currentScore + 5, 100),
    );

    toast.success(
      "Recommended price applied",
      {
        description:
          "The listing score increased by 5 points.",
      },
    );
  }

  return (
    <div className="min-w-0">
      <div className="flex justify-stretch sm:justify-end">
        <ApplyAllFixesButton
          onApply={applyAllFixes}
          disabled={everythingApplied}
        />
      </div>

      <div className="mt-4 min-w-0 sm:mt-5">
        <ListingStats
          listing={{
            ...listing,
            currentTitle,
            price: currentPrice,
            score,
          }}
        />
      </div>

      <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 sm:mt-6 sm:gap-6 xl:grid-cols-2">
        <div className="min-w-0">
          <ImageOptimizer
            imageUrl={listing.imageUrl}
            issue={listing.imageIssue}
            onApply={() => {
              if (imageApplied) {
                return;
              }

              setImageApplied(true);

              setScore((currentScore) =>
                Math.min(
                  currentScore + 7,
                  100,
                ),
              );
            }}
            isApplied={imageApplied}
          />
        </div>

        <div className="min-w-0">
          <TitleOptimizer
            currentTitle={currentTitle}
            suggestedTitle={
              listing.suggestedTitle
            }
            onAccept={acceptTitle}
            isApplied={
              currentTitle ===
              listing.suggestedTitle
            }
          />
        </div>

        <div className="min-w-0">
          <PricingOptimizer
            currentPrice={currentPrice}
            recommendedPrice={
              listing.recommendedPrice
            }
            onAccept={acceptPrice}
            isApplied={
              currentPrice ===
              listing.recommendedPrice
            }
          />
        </div>

        <div className="min-w-0">
          <DescriptionOptimizer
            description={listing.description}
          />
        </div>

        <div className="min-w-0 xl:col-span-2">
          <TagsOptimizer tags={listing.tags} />
        </div>
      </div>
    </div>
  );
}