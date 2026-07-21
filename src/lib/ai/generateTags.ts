import { openai } from "@/lib/ai/openai";
import { buildTagGenerationPrompt } from "@/lib/ai/prompts";

const ETSY_TAG_COUNT = 13;
const ETSY_TAG_MAX_LENGTH = 20;

type TagValidationResult =
  | {
      valid: true;
      tags: string[];
    }
  | {
      valid: false;
      reason: string;
    };

function removeCodeFence(value: string) {
  return value
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function validateTagResponse(
  rawOutput: string,
): TagValidationResult {
  let parsedOutput: unknown;

  try {
    parsedOutput = JSON.parse(
      removeCodeFence(rawOutput),
    );
  } catch {
    return {
      valid: false,
      reason:
        "The response was not a valid JSON array.",
    };
  }

  if (!Array.isArray(parsedOutput)) {
    return {
      valid: false,
      reason:
        "The response was not an array of tags.",
    };
  }

  if (
    parsedOutput.some(
      (tag) => typeof tag !== "string",
    )
  ) {
    return {
      valid: false,
      reason:
        "One or more generated tags were not text.",
    };
  }

  const normalizedTags = parsedOutput
    .map((tag) =>
      tag
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " "),
    )
    .filter(Boolean);

  const uniqueTags = [...new Set(normalizedTags)];

  const tagsThatAreTooLong = uniqueTags.filter(
    (tag) => tag.length > ETSY_TAG_MAX_LENGTH,
  );

  if (tagsThatAreTooLong.length > 0) {
    return {
      valid: false,
      reason: `${tagsThatAreTooLong.length} ${
        tagsThatAreTooLong.length === 1
          ? "tag was"
          : "tags were"
      } longer than ${ETSY_TAG_MAX_LENGTH} characters.`,
    };
  }

  if (uniqueTags.length !== ETSY_TAG_COUNT) {
    return {
      valid: false,
      reason: `The response contained ${uniqueTags.length} valid unique tags instead of ${ETSY_TAG_COUNT}.`,
    };
  }

  return {
    valid: true,
    tags: uniqueTags,
  };
}

async function requestTags(
  prompt: string,
): Promise<string> {
  const response = await openai.responses.create({
    model: "gpt-5-mini",
    input: prompt,
  });

  return response.output_text.trim();
}

export async function generateTags(
  title: string,
  description: string,
  currentTags: string[] = [],
): Promise<string[]> {
  const cleanedTitle = title.trim();
  const cleanedDescription = description.trim();

  if (!cleanedTitle) {
    throw new Error("A listing title is required.");
  }

  const initialPrompt = `
${buildTagGenerationPrompt(
  cleanedTitle,
  cleanedDescription,
  currentTags,
)}

Additional mandatory validation rules:

- Every tag must be 20 characters or fewer, including spaces.
- Count the characters in every tag before responding.
- Return exactly 13 unique tags.
`;

  const firstOutput =
    await requestTags(initialPrompt);

  if (!firstOutput) {
    throw new Error(
      "OpenAI did not return any suggested tags.",
    );
  }

  const firstValidation =
    validateTagResponse(firstOutput);

  if (firstValidation.valid) {
    return firstValidation.tags;
  }

  const correctionPrompt = `
Correct the invalid Etsy tag response below.

Validation problem:

${firstValidation.reason}

Requirements:

- Return exactly 13 unique Etsy tags.
- Every tag must be 20 characters or fewer, including spaces.
- Shorten long phrases naturally.
- Preserve the actual product meaning.
- Use specific buyer-search phrases.
- Avoid duplicate or nearly identical tags.
- Return ONLY a valid JSON array of strings.
- Do not include markdown or commentary.

Listing title:

${cleanedTitle}

Listing description:

${cleanedDescription}

Invalid response:

${firstOutput}
`;

  const correctedOutput =
    await requestTags(correctionPrompt);

  if (!correctedOutput) {
    throw new Error(
      "OpenAI did not return corrected tags.",
    );
  }

  const correctedValidation =
    validateTagResponse(correctedOutput);

  if (!correctedValidation.valid) {
    throw new Error(
      `The AI could not produce 13 valid Etsy tags after two attempts. ${correctedValidation.reason}`,
    );
  }

  return correctedValidation.tags;
}