import type { ScoreResult } from "@/lib/scoring/types";

export type PricingBenchmark = {
  averagePrice?: number;
  minimumPrice?: number;
  maximumPrice?: number;
};

export function calculatePricingScore(
  price: number,
  benchmark: PricingBenchmark = {},
): ScoreResult {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  const recommendations: ScoreResult["recommendations"] =
    [];

  if (
    !Number.isFinite(price) ||
    price <= 0
  ) {
    return {
      score: 0,
      strengths,
      weaknesses: [
        "This listing does not have a valid selling price.",
      ],
      recommendations: [
        {
          title: "Set a valid listing price",
          description:
            "Add a selling price greater than zero before publishing or optimizing this listing.",
          impact: "high",
        },
      ],
    };
  }

  strengths.push(
    "The listing has a valid selling price.",
  );

  const {
    averagePrice,
    minimumPrice,
    maximumPrice,
  } = benchmark;

  const hasAveragePrice =
    typeof averagePrice === "number" &&
    Number.isFinite(averagePrice) &&
    averagePrice > 0;

  let score = 75;

  if (!hasAveragePrice) {
    weaknesses.push(
      "Market pricing data is not yet available for this listing.",
    );

    recommendations.push({
      title: "Compare similar listings",
      description:
        "Review comparable products with similar materials, quantity, personalization, and shipping terms before deciding whether the price is competitive.",
      impact: "medium",
    });

    return {
      score,
      strengths,
      weaknesses,
      recommendations,
    };
  }

  const priceRatio = price / averagePrice;

  if (priceRatio >= 0.85 && priceRatio <= 1.15) {
    score = 100;

    strengths.push(
      "The price is close to the current market average.",
    );
  } else if (
    priceRatio >= 0.7 &&
    priceRatio < 0.85
  ) {
    score = 85;

    weaknesses.push(
      "The listing is priced moderately below the market average.",
    );

    recommendations.push({
      title: "Review the profit margin",
      description:
        "Confirm that the current price covers materials, labor, packaging, promotions, and other business costs.",
      impact: "medium",
    });
  } else if (
    priceRatio > 1.15 &&
    priceRatio <= 1.35
  ) {
    score = 85;

    weaknesses.push(
      "The listing is priced moderately above the market average.",
    );

    recommendations.push({
      title: "Strengthen the value presentation",
      description:
        "Use the images and description to clearly communicate quality, craftsmanship, included items, personalization, and other reasons for the higher price.",
      impact: "medium",
    });
  } else if (priceRatio < 0.7) {
    score = 60;

    weaknesses.push(
      "The listing is priced substantially below the market average.",
    );

    recommendations.push({
      title: "Review possible underpricing",
      description:
        "Check whether the price properly reflects product quality, materials, labor, packaging, and the value delivered to the buyer.",
      impact: "high",
    });
  } else {
    score = 60;

    weaknesses.push(
      "The listing is priced substantially above the market average.",
    );

    recommendations.push({
      title: "Justify or adjust the premium price",
      description:
        "Confirm that the product has clear premium advantages. Highlight those differences prominently or consider testing a more competitive price.",
      impact: "high",
    });
  }

  const hasMinimumPrice =
    typeof minimumPrice === "number" &&
    Number.isFinite(minimumPrice);

  const hasMaximumPrice =
    typeof maximumPrice === "number" &&
    Number.isFinite(maximumPrice);

  if (
    hasMinimumPrice &&
    hasMaximumPrice &&
    price >= minimumPrice &&
    price <= maximumPrice
  ) {
    strengths.push(
      "The price falls within the observed market range.",
    );
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    strengths,
    weaknesses,
    recommendations,
  };
}