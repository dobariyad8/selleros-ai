import { ScoreResult } from "./types";

export function calculateTitleScore(
  title: string
): ScoreResult {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: ScoreResult["recommendations"] = [];

  let score = 0;

  const normalizedTitle = title.trim();
  const words = normalizedTitle
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  const uniqueWords = new Set(words);

  // -----------------------
  // Title Length
  // -----------------------

  if (normalizedTitle.length >= 110 && normalizedTitle.length <= 140) {
    score += 20;
    strengths.push("Excellent title length.");
  } else if (normalizedTitle.length >= 80) {
    score += 15;
    strengths.push("Good title length.");
  } else {
    score += 8;
    weaknesses.push("Title is shorter than recommended.");

    recommendations.push({
      title: "Increase title length",
      description:
        "Use more relevant keywords while keeping the title readable.",
      impact: "medium",
    });
  }

  // -----------------------
  // Keyword Diversity
  // -----------------------

  if (uniqueWords.size >= 10) {
    score += 20;
    strengths.push("Strong keyword variety.");
  } else {
    score += 10;

    weaknesses.push("Add more keyword variety.");

    recommendations.push({
      title: "Expand keyword coverage",
      description:
        "Include additional relevant search phrases buyers may use.",
      impact: "high",
    });
  }

  // -----------------------
  // Duplicate Keywords
  // -----------------------

  const diversity = uniqueWords.size / words.length;

  if (diversity >= 0.8) {
    score += 15;
    strengths.push("Minimal keyword repetition.");
  } else {
    weaknesses.push("Too many repeated keywords.");

    recommendations.push({
      title: "Reduce repeated keywords",
      description:
        "Replace repeated words with related search terms.",
      impact: "medium",
    });
  }

  // -----------------------
  // Readability
  // -----------------------

  if (normalizedTitle.length <= 145) {
    score += 15;
    strengths.push("Easy to read.");
  }

  // -----------------------
  // Basic Formatting
  // -----------------------

  const hasMostlyUppercase =
    normalizedTitle === normalizedTitle.toUpperCase();

  if (!hasMostlyUppercase) {
    score += 10;
    strengths.push("Professional capitalization.");
  } else {
    weaknesses.push("Avoid writing the entire title in uppercase.");

    recommendations.push({
      title: "Improve capitalization",
      description:
        "Use normal title casing instead of all uppercase text.",
      impact: "low",
    });
  }

  // -----------------------
  // Final Score
  // -----------------------

  return {
    score: Math.min(score, 100),
    strengths,
    weaknesses,
    recommendations,
  };
}