import type { ScoreResult } from "@/lib/scoring/types";

export type ListingAuditScores = {
  title: number;
  tags: number;
  description: number;
  images: number;
  pricing: number;
};

type ScoreCategory = {
  key: keyof ListingAuditScores;
  label: string;
  score: number;
  weight: number;
};

function clampScore(score: number) {
  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(0, Math.min(100, score));
}

export function calculateOverallScore(
  scores: ListingAuditScores,
): ScoreResult {
  const categories: ScoreCategory[] = [
    {
      key: "title",
      label: "Title",
      score: clampScore(scores.title),
      weight: 0.25,
    },
    {
      key: "tags",
      label: "Tags",
      score: clampScore(scores.tags),
      weight: 0.25,
    },
    {
      key: "description",
      label: "Description",
      score: clampScore(scores.description),
      weight: 0.15,
    },
    {
      key: "images",
      label: "Images",
      score: clampScore(scores.images),
      weight: 0.25,
    },
    {
      key: "pricing",
      label: "Pricing",
      score: clampScore(scores.pricing),
      weight: 0.1,
    },
  ];

  const overallScore = Math.round(
    categories.reduce(
      (total, category) =>
        total + category.score * category.weight,
      0,
    ),
  );

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  const recommendations: ScoreResult["recommendations"] =
    [];

  const sortedCategories = [...categories].sort(
    (first, second) => first.score - second.score,
  );

  const weakestCategory = sortedCategories[0];
  const strongestCategory =
    sortedCategories[sortedCategories.length - 1];

  if (strongestCategory.score >= 85) {
    strengths.push(
      `${strongestCategory.label} is currently the strongest part of this listing.`,
    );
  }

  const healthyCategories = categories.filter(
    (category) => category.score >= 80,
  );

  if (healthyCategories.length >= 3) {
    strengths.push(
      `${healthyCategories.length} listing areas currently have healthy scores.`,
    );
  }

  const weakCategories = categories.filter(
    (category) => category.score < 70,
  );

  if (weakCategories.length > 0) {
    weaknesses.push(
      `${weakCategories.length} listing ${
        weakCategories.length === 1 ? "area needs" : "areas need"
      } meaningful improvement.`,
    );
  }

  if (weakestCategory.score < 80) {
    weaknesses.push(
      `${weakestCategory.label} is currently the lowest-scoring area at ${weakestCategory.score}/100.`,
    );

    recommendations.push({
      title: `Prioritize ${weakestCategory.label}`,
      description:
        `Start with the ${weakestCategory.label.toLowerCase()} recommendations. Improving the weakest area is likely to produce the largest immediate increase in the overall listing score.`,
      impact:
        weakestCategory.score < 60
          ? "high"
          : "medium",
    });
  }

  if (overallScore >= 85) {
    strengths.push(
      "The listing has a strong overall optimization foundation.",
    );
  } else if (overallScore < 60) {
    weaknesses.push(
      "The listing has several optimization gaps that may reduce buyer confidence or discoverability.",
    );

    recommendations.push({
      title: "Complete a full listing optimization",
      description:
        "Work through the recommendations for the lowest-scoring categories before making smaller refinements.",
      impact: "high",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      title: "Maintain and test improvements",
      description:
        "The listing has a healthy overall score. Continue testing images, wording, and pricing while monitoring performance over time.",
      impact: "low",
    });
  }

  return {
    score: overallScore,
    strengths,
    weaknesses,
    recommendations,
  };
}