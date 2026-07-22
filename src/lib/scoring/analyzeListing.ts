import { calculateDescriptionScore } from "@/lib/scoring/descriptionScore";
import { calculateImageScore } from "@/lib/scoring/imageScore";
import { calculateOverallScore } from "@/lib/scoring/overallScore";
import { calculatePricingScore } from "@/lib/scoring/pricingScore";
import { calculateTagScore } from "@/lib/scoring/tagScore";
import { calculateTitleScore } from "@/lib/scoring/titleScore";

export type ListingScoreCategory =
  | "Title"
  | "Tags"
  | "Description"
  | "Images"
  | "Pricing";

export type ScorableListing = {
  title?: string | null;
  tags?: string[] | null;
  description?: string | null;
  imageUrls?: string[] | null;
  price?: number | string | null;
};

export type CategoryScore = {
  category: ListingScoreCategory;
  score: number;
};

export type ListingScores = {
  title: number;
  tags: number;
  description: number;
  images: number;
  pricing: number;
  overall: number;
};

export type ListingAnalysis = {
  scores: ListingScores;
  categories: CategoryScore[];
  weakestCategory: CategoryScore;
  opportunityCount: number;
};

function normalizePrice(
  price: ScorableListing["price"],
) {
  const numericPrice = Number(price ?? 0);

  return Number.isFinite(numericPrice)
    ? numericPrice
    : 0;
}

export function analyzeListing(
  listing: ScorableListing,
): ListingAnalysis {
  const title = listing.title?.trim() ?? "";
  const tags = listing.tags ?? [];
  const description =
    listing.description?.trim() ?? "";
  const imageUrls = listing.imageUrls ?? [];
  const price = normalizePrice(listing.price);

  const titleResult =
    calculateTitleScore(title);

  const tagResult = calculateTagScore(
    tags,
    title,
  );

  const descriptionResult =
    calculateDescriptionScore(
      description,
      title,
    );

  const imageResult =
    calculateImageScore(imageUrls);

  const pricingResult =
    calculatePricingScore(price);

  const overallResult =
    calculateOverallScore({
      title: titleResult.score,
      tags: tagResult.score,
      description: descriptionResult.score,
      images: imageResult.score,
      pricing: pricingResult.score,
    });

  const categories: CategoryScore[] = [
    {
      category: "Title",
      score: titleResult.score,
    },
    {
      category: "Tags",
      score: tagResult.score,
    },
    {
      category: "Description",
      score: descriptionResult.score,
    },
    {
      category: "Images",
      score: imageResult.score,
    },
    {
      category: "Pricing",
      score: pricingResult.score,
    },
  ];

  const weakestCategory = categories.reduce(
    (weakest, current) =>
      current.score < weakest.score
        ? current
        : weakest,
  );

  return {
    scores: {
      title: titleResult.score,
      tags: tagResult.score,
      description: descriptionResult.score,
      images: imageResult.score,
      pricing: pricingResult.score,
      overall: overallResult.score,
    },
    categories,
    weakestCategory,
    opportunityCount: categories.filter(
      (category) => category.score < 70,
    ).length,
  };
}

export function calculateAverageScore(
  values: number[],
) {
  if (values.length === 0) {
    return 0;
  }

  const total = values.reduce(
    (sum, value) => sum + value,
    0,
  );

  return Math.round(total / values.length);
}