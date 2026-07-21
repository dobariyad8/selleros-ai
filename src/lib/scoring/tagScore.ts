import type { ScoreResult } from "@/lib/scoring/types";

const MAX_ETSY_TAGS = 13;

export function calculateTagScore(
  tags: string[],
  title = "",
): ScoreResult {
  let score = 100;

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: ScoreResult["recommendations"] =
    [];

  const cleanedTags = tags
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);

  const uniqueTags = [...new Set(cleanedTags)];

  const duplicateCount =
    cleanedTags.length - uniqueTags.length;

  const multiWordTags = uniqueTags.filter(
    (tag) => tag.split(/\s+/).length >= 2,
  );

  const genericTags = uniqueTags.filter((tag) => {
    const wordCount = tag.split(/\s+/).length;

    return wordCount === 1 && tag.length < 8;
  });

  const titleWords = new Set(
    title
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length >= 3),
  );

  const matchingTags = uniqueTags.filter((tag) =>
    tag
      .split(/\s+/)
      .some((word) => titleWords.has(word)),
  );

  if (uniqueTags.length === MAX_ETSY_TAGS) {
    strengths.push("All 13 available Etsy tags are being used.");
  } else {
    const missingTags =
      MAX_ETSY_TAGS - uniqueTags.length;

    score -= Math.min(missingTags * 4, 32);

    weaknesses.push(
      `${missingTags} available tag slot${
        missingTags === 1 ? " is" : "s are"
      } not being used.`,
    );

    recommendations.push({
      title: "Use all available tag slots",
      description:
        "Add relevant search phrases until all 13 Etsy tag slots are filled. Each unused slot is a missed opportunity to target another buyer search.",
      impact: "high",
    });
  }

  if (duplicateCount === 0) {
    strengths.push(
      "The listing does not contain duplicate tags.",
    );
  } else {
    score -= Math.min(duplicateCount * 8, 24);

    weaknesses.push(
      `${duplicateCount} duplicate tag${
        duplicateCount === 1 ? " was" : "s were"
      } detected.`,
    );

    recommendations.push({
      title: "Replace duplicate tags",
      description:
        "Use each tag slot for a different relevant buyer phrase instead of repeating the same keyword.",
      impact: "high",
    });
  }

  const multiWordRatio =
    uniqueTags.length > 0
      ? multiWordTags.length / uniqueTags.length
      : 0;

  if (multiWordRatio >= 0.6) {
    strengths.push(
      "Most tags use specific multi-word search phrases.",
    );
  } else {
    score -= 15;

    weaknesses.push(
      "Too many tags are single words instead of buyer-focused phrases.",
    );

    recommendations.push({
      title: "Use more specific search phrases",
      description:
        'Replace broad single-word tags with phrases such as "couple rakhi set" or "rakhi gift for brother" that better reflect how buyers search.',
      impact: "high",
    });
  }

  if (genericTags.length > 0) {
    score -= Math.min(genericTags.length * 3, 15);

    weaknesses.push(
      `${genericTags.length} tag${
        genericTags.length === 1 ? " appears" : "s appear"
      } too broad or generic.`,
    );

    recommendations.push({
      title: "Replace generic tags",
      description:
        "Use descriptive phrases that communicate the product, recipient, occasion, style, or buying intent.",
      impact: "medium",
    });
  } else if (uniqueTags.length > 0) {
    strengths.push(
      "The tags are reasonably descriptive and specific.",
    );
  }

  if (title.trim().length > 0) {
    const titleMatchRatio =
      uniqueTags.length > 0
        ? matchingTags.length / uniqueTags.length
        : 0;

    if (titleMatchRatio >= 0.5) {
      strengths.push(
        "The title and tags reinforce several of the same keywords.",
      );
    } else {
      score -= 12;

      weaknesses.push(
        "The title and tags have limited keyword alignment.",
      );

      recommendations.push({
        title: "Align the title and tags",
        description:
          "Include important title keywords in relevant tags so the listing sends Etsy a consistent signal about what the product is.",
        impact: "medium",
      });
    }
  }

  if (uniqueTags.length === 0) {
    score = 0;

    weaknesses.push("This listing does not have any tags.");

    recommendations.push({
      title: "Add relevant Etsy tags",
      description:
        "Add up to 13 specific search phrases describing the product, recipient, occasion, style, and buying intent.",
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