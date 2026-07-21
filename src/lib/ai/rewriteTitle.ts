import { openai } from "@/lib/ai/openai";
import { buildTitleRewritePrompt } from "@/lib/ai/prompts";
import { calculateTitleScore } from "@/lib/scoring/titleScore";

const ETSY_TITLE_MAX_LENGTH = 140;

function cleanGeneratedTitle(value: string) {
  return value
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\s+/g, " ");
}

function isValidTitle(title: string) {
  return (
    title.length > 0 &&
    title.length <= ETSY_TITLE_MAX_LENGTH
  );
}

async function requestTitleRewrite(
  prompt: string,
): Promise<string> {
  const response = await openai.responses.create({
    model: "gpt-5-mini",
    input: prompt,
  });

  return cleanGeneratedTitle(
    response.output_text,
  );
}

export async function rewriteTitle(
  title: string,
): Promise<string> {
  const cleanedTitle = title.trim();

  if (!cleanedTitle) {
    throw new Error("A listing title is required.");
  }

  const currentScore =
    calculateTitleScore(cleanedTitle).score;

  const firstSuggestion = await requestTitleRewrite(
    buildTitleRewritePrompt(cleanedTitle),
  );

  const validSuggestions: string[] = [];

  if (isValidTitle(firstSuggestion)) {
    validSuggestions.push(firstSuggestion);

    const firstScore =
      calculateTitleScore(firstSuggestion).score;

    if (firstScore > currentScore) {
      return firstSuggestion;
    }
  }

  const correctionPrompt = `
You are improving an Etsy listing title.

The first attempted rewrite did not pass all quality checks.

Original title:

${cleanedTitle}

First attempted rewrite:

${firstSuggestion || "No usable title was returned."}

Current rule-based score:

${currentScore}/100

Requirements:

- Return a stronger title than the original.
- Keep the title at or below ${ETSY_TITLE_MAX_LENGTH} characters, including spaces.
- Preserve the real product meaning.
- Put the most important buyer-focused phrase near the beginning.
- Use useful keyword variety.
- Avoid repeating the same words unnecessarily.
- Avoid keyword stuffing.
- Make the title natural and readable.
- Return ONLY the corrected title.
`;

  const secondSuggestion =
    await requestTitleRewrite(correctionPrompt);

  if (isValidTitle(secondSuggestion)) {
    validSuggestions.push(secondSuggestion);
  }

  if (validSuggestions.length === 0) {
    throw new Error(
      `OpenAI could not produce a valid title within ${ETSY_TITLE_MAX_LENGTH} characters.`,
    );
  }

  const rankedSuggestions = validSuggestions
    .map((suggestion) => ({
      suggestion,
      score:
        calculateTitleScore(suggestion).score,
    }))
    .sort(
      (first, second) =>
        second.score - first.score,
    );

  return rankedSuggestions[0].suggestion;
}