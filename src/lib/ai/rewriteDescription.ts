import { openai } from "@/lib/ai/openai";
import { buildDescriptionRewritePrompt } from "@/lib/ai/prompts";
import { calculateDescriptionScore } from "@/lib/scoring/descriptionScore";

function cleanGeneratedDescription(value: string) {
  return value
    .trim()
    .replace(/^```(?:text|markdown)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function isValidDescription(description: string) {
  return description.trim().length > 0;
}

async function requestDescriptionRewrite(
  prompt: string,
): Promise<string> {
  const response = await openai.responses.create({
    model: "gpt-5-mini",
    input: prompt,
  });

  return cleanGeneratedDescription(
    response.output_text,
  );
}

export async function rewriteDescription(
  title: string,
  description: string,
): Promise<string> {
  const cleanedTitle = title.trim();
  const cleanedDescription = description.trim();

  if (!cleanedTitle) {
    throw new Error("A listing title is required.");
  }

  if (!cleanedDescription) {
    throw new Error(
      "A current description is required before generating a rewrite.",
    );
  }

  const currentScore = calculateDescriptionScore(
    cleanedDescription,
    cleanedTitle,
  ).score;

  const firstSuggestion =
    await requestDescriptionRewrite(
      buildDescriptionRewritePrompt(
        cleanedTitle,
        cleanedDescription,
      ),
    );

  const validSuggestions: string[] = [];

  if (isValidDescription(firstSuggestion)) {
    validSuggestions.push(firstSuggestion);

    const firstScore =
      calculateDescriptionScore(
        firstSuggestion,
        cleanedTitle,
      ).score;

    if (firstScore > currentScore) {
      return firstSuggestion;
    }
  }

  const correctionPrompt = `
You are improving an Etsy product description.

The first attempted rewrite did not improve the
rule-based description score enough.

Listing title:

${cleanedTitle}

Original description:

${cleanedDescription}

First attempted rewrite:

${firstSuggestion || "No usable description was returned."}

Current description score:

${currentScore}/100

Requirements:

- Produce a stronger and more readable description.
- Preserve every factual product detail from the original.
- Do not invent materials, dimensions, quantities,
  personalization options, shipping times, care instructions,
  or other product details.
- Begin with a clear product overview.
- Use short, readable paragraphs.
- Use bullet points for important product details.
- Answer practical buyer questions using only facts already
  present in the original description.
- Naturally reinforce relevant words from the listing title.
- Avoid keyword stuffing.
- Do not include commentary about the rewrite.
- Return ONLY the corrected product description.
`;

  const secondSuggestion =
    await requestDescriptionRewrite(
      correctionPrompt,
    );

  if (isValidDescription(secondSuggestion)) {
    validSuggestions.push(secondSuggestion);
  }

  if (validSuggestions.length === 0) {
    throw new Error(
      "OpenAI could not produce a usable description rewrite.",
    );
  }

  const rankedSuggestions = validSuggestions
    .map((suggestion) => ({
      suggestion,
      score: calculateDescriptionScore(
        suggestion,
        cleanedTitle,
      ).score,
    }))
    .sort(
      (first, second) =>
        second.score - first.score,
    );

  return rankedSuggestions[0].suggestion;
}