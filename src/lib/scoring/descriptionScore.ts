import type { ScoreResult } from "@/lib/scoring/types";

export function calculateDescriptionScore(
  description: string,
  title = "",
): ScoreResult {
  const cleanedDescription = description.trim();

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: ScoreResult["recommendations"] = [];

  if (!cleanedDescription) {
    return {
      score: 0,
      strengths,
      weaknesses: [
        "This listing does not have a description.",
      ],
      recommendations: [
        {
          title: "Add a complete product description",
          description:
            "Explain what the product is, who it is for, what is included, and any important size, material, care, shipping, or personalization details.",
          impact: "high",
        },
      ],
    };
  }

  let score = 100;

  const characterCount = cleanedDescription.length;

  const paragraphs = cleanedDescription
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const lines = cleanedDescription
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const bulletLines = lines.filter((line) =>
    /^[-•*✓✔]/.test(line),
  );

  const titleWords = new Set(
    title
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length >= 4),
  );

  const openingText = cleanedDescription
    .slice(0, 250)
    .toLowerCase();

  const openingKeywordMatches = [...titleWords].filter(
    (word) => openingText.includes(word),
  );

  if (characterCount >= 300) {
    strengths.push(
      "The description provides a useful amount of product information.",
    );
  } else {
    score -= 25;

    weaknesses.push(
      "The description may be too short to answer common buyer questions.",
    );

    recommendations.push({
      title: "Add more useful product details",
      description:
        "Include the product purpose, recipient, materials, dimensions, included items, personalization options, and care or shipping information when relevant.",
      impact: "high",
    });
  }

  if (characterCount > 5000) {
    score -= 10;

    weaknesses.push(
      "The description may be too long and difficult to scan.",
    );

    recommendations.push({
      title: "Make the description easier to scan",
      description:
        "Remove repeated information and organize the most important details into short sections.",
      impact: "medium",
    });
  }

  if (paragraphs.length >= 3) {
    strengths.push(
      "The description is divided into readable sections.",
    );
  } else {
    score -= 15;

    weaknesses.push(
      "The description has limited paragraph structure.",
    );

    recommendations.push({
      title: "Break the description into sections",
      description:
        "Use short paragraphs for the product overview, features, measurements, personalization, and shipping information.",
      impact: "medium",
    });
  }

  if (bulletLines.length >= 3) {
    strengths.push(
      "Bullet points make important product details easy to scan.",
    );
  } else {
    score -= 10;

    weaknesses.push(
      "Important details are not presented in an easily scannable format.",
    );

    recommendations.push({
      title: "Add a product-details list",
      description:
        "Use bullet points for materials, size, quantity, colors, personalization, and what the buyer will receive.",
      impact: "medium",
    });
  }

  if (
    titleWords.size > 0 &&
    openingKeywordMatches.length > 0
  ) {
    strengths.push(
      "The opening section clearly reinforces the product shown in the title.",
    );
  } else if (title.trim()) {
    score -= 12;

    weaknesses.push(
      "The opening section has limited alignment with the listing title.",
    );

    recommendations.push({
      title: "Clarify the product immediately",
      description:
        "Use the first one or two sentences to clearly describe the product using natural wording that matches the main listing topic.",
      impact: "high",
    });
  }

  const buyerDetailPatterns = [
    /\bmaterial(s)?\b/i,
    /\bsize\b/i,
    /\bdimension(s)?\b/i,
    /\bpersonaliz/i,
    /\bshipping\b/i,
    /\bcare\b/i,
    /\bincludes?\b/i,
  ];

  const detailCount = buyerDetailPatterns.filter(
    (pattern) => pattern.test(cleanedDescription),
  ).length;

  if (detailCount >= 3) {
    strengths.push(
      "The description addresses several practical buyer questions.",
    );
  } else {
    score -= 15;

    weaknesses.push(
      "The description may be missing practical purchase details.",
    );

    recommendations.push({
      title: "Answer common buyer questions",
      description:
        "Add relevant details about materials, dimensions, quantity, personalization, care, processing, or shipping.",
      impact: "high",
    });
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    strengths,
    weaknesses,
    recommendations,
  };
}