import type { ScoreResult } from "@/lib/scoring/types";

export function calculateImageScore(
  imageUrls: string[],
): ScoreResult {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  const recommendations: ScoreResult["recommendations"] =
    [];

  const cleanedImageUrls = imageUrls
    .map((url) => url.trim())
    .filter(Boolean);

  const uniqueImageUrls = [
    ...new Set(cleanedImageUrls),
  ];

  const imageCount = uniqueImageUrls.length;

  if (imageCount === 0) {
    return {
      score: 0,
      strengths,
      weaknesses: [
        "This listing does not have any usable product images.",
      ],
      recommendations: [
        {
          title: "Add product images",
          description:
            "Add clear images showing the complete product, important details, scale, packaging, and how the product may be used.",
          impact: "high",
        },
      ],
    };
  }

  let score = 100;

  if (imageCount >= 8) {
    strengths.push(
      "The listing uses a strong number of product images.",
    );
  } else if (imageCount >= 5) {
    score -= 8;

    strengths.push(
      "The listing includes several product images.",
    );

    weaknesses.push(
      "There may still be room to show additional product details or use cases.",
    );

    recommendations.push({
      title: "Add more supporting images",
      description:
        "Consider adding close-ups, scale references, packaging, alternate angles, personalization examples, or lifestyle images.",
      impact: "medium",
    });
  } else if (imageCount >= 3) {
    score -= 25;

    weaknesses.push(
      `The listing currently uses only ${imageCount} unique images.`,
    );

    recommendations.push({
      title: "Create a more complete image gallery",
      description:
        "Show the product from multiple angles and include close-ups, scale references, packaging, and lifestyle or gifting examples when relevant.",
      impact: "high",
    });
  } else {
    score -= 45;

    weaknesses.push(
      `The listing has only ${imageCount} unique product ${
        imageCount === 1 ? "image" : "images"
      }.`,
    );

    recommendations.push({
      title: "Add several additional product images",
      description:
        "Buyers need enough visual information to understand the product. Add alternate angles, detail shots, scale, packaging, and examples of how it looks when used.",
      impact: "high",
    });
  }

  const duplicateCount =
    cleanedImageUrls.length - uniqueImageUrls.length;

  if (duplicateCount === 0) {
    strengths.push(
      "No duplicate image URLs were detected.",
    );
  } else {
    score -= Math.min(duplicateCount * 6, 18);

    weaknesses.push(
      `${duplicateCount} duplicate image ${
        duplicateCount === 1 ? "entry was" : "entries were"
      } detected.`,
    );

    recommendations.push({
      title: "Replace duplicate images",
      description:
        "Use each image position to provide buyers with new visual information rather than repeating the same image.",
      impact: "medium",
    });
  }

  if (imageCount >= 5) {
    strengths.push(
      "The image gallery gives buyers multiple opportunities to inspect the product.",
    );
  }

  if (imageCount < 4) {
    weaknesses.push(
      "The image gallery may not answer common visual questions about size, details, packaging, or use.",
    );
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    strengths,
    weaknesses,
    recommendations,
  };
}