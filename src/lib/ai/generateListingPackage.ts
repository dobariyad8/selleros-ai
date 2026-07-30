import "server-only";

import { openai } from "@/lib/ai/openai";

const ETSY_TAG_COUNT = 13;
const ETSY_TAG_MAX_LENGTH = 20;
const ETSY_TITLE_MAX_LENGTH = 140;

export type GenerateListingPackageInput = {
  productName: string;
  productDescription: string;
  productType?: string;
  materials?: string;
  primaryColor?: string;
  secondaryColor?: string;
  dimensions?: string;
  price?: string;
  quantity?: string;
  occasion?: string;
  personalization?: string;
  productionTime?: string;
};

export type ListingImagePlanItem = {
  id: string;
  type:
    | "studio"
    | "lifestyle"
    | "detail"
    | "scale"
    | "gift"
    | "seasonal";
  title: string;
  description: string;
  generationInstructions: string;
};

export type GeneratedListingPackage = {
  title: string;
  description: string;
  tags: string[];
  materials: string[];
  highlights: string[];
  imagePlan: ListingImagePlanItem[];
};

type ListingPackageResponse = {
  title?: unknown;
  description?: unknown;
  tags?: unknown;
  materials?: unknown;
  highlights?: unknown;
  imagePlan?: unknown;
};

function removeCodeFence(value: string) {
  return value
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function cleanStringArray(
  value: unknown,
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .filter(
          (item): item is string =>
            typeof item === "string",
        )
        .map((item) =>
          item.trim().replace(/\s+/g, " "),
        )
        .filter(Boolean),
    ),
  ];
}

function validateTags(
  value: unknown,
) {
  const tags = cleanStringArray(value).map(
    (tag) => tag.toLowerCase(),
  );

  if (tags.length !== ETSY_TAG_COUNT) {
    throw new Error(
      `The AI returned ${tags.length} tags instead of ${ETSY_TAG_COUNT}.`,
    );
  }

  const longTags = tags.filter(
    (tag) =>
      tag.length > ETSY_TAG_MAX_LENGTH,
  );

  if (longTags.length > 0) {
    throw new Error(
      "One or more generated Etsy tags exceeded 20 characters.",
    );
  }

  return tags;
}

function validateImagePlan(
  value: unknown,
): ListingImagePlanItem[] {
  if (!Array.isArray(value)) {
    throw new Error(
      "The AI did not return an image plan.",
    );
  }

  const validTypes =
    new Set<ListingImagePlanItem["type"]>([
      "studio",
      "lifestyle",
      "detail",
      "scale",
      "gift",
      "seasonal",
    ]);

  const plan = value
    .map((item, index) => {
      if (
        !item ||
        typeof item !== "object"
      ) {
        return null;
      }

      const record = item as Record<
        string,
        unknown
      >;

      const type =
        typeof record.type === "string" &&
        validTypes.has(
          record.type as ListingImagePlanItem["type"],
        )
          ? (record.type as ListingImagePlanItem["type"])
          : null;

      const title =
        typeof record.title === "string"
          ? record.title.trim()
          : "";

      const description =
        typeof record.description === "string"
          ? record.description.trim()
          : "";

      const generationInstructions =
        typeof record.generationInstructions ===
        "string"
          ? record.generationInstructions.trim()
          : "";

      if (
        !type ||
        !title ||
        !description ||
        !generationInstructions
      ) {
        return null;
      }

      return {
        id: `${type}-${index + 1}`,
        type,
        title,
        description,
        generationInstructions,
      };
    })
    .filter(
      (
        item,
      ): item is ListingImagePlanItem =>
        item !== null,
    );

  if (plan.length !== 6) {
    throw new Error(
      `The AI returned ${plan.length} image concepts instead of 6.`,
    );
  }

  return plan;
}

function validateResponse(
  rawOutput: string,
): GeneratedListingPackage {
  let parsed: ListingPackageResponse;

  try {
    parsed = JSON.parse(
      removeCodeFence(rawOutput),
    ) as ListingPackageResponse;
  } catch {
    throw new Error(
      "The AI listing response was not valid JSON.",
    );
  }

  const title =
    typeof parsed.title === "string"
      ? parsed.title.trim()
      : "";

  const description =
    typeof parsed.description === "string"
      ? parsed.description.trim()
      : "";

  if (!title) {
    throw new Error(
      "The AI did not return a listing title.",
    );
  }

  if (
    title.length >
    ETSY_TITLE_MAX_LENGTH
  ) {
    throw new Error(
      "The generated listing title exceeded 140 characters.",
    );
  }

  if (!description) {
    throw new Error(
      "The AI did not return a listing description.",
    );
  }

  const tags = validateTags(parsed.tags);

  const materials = cleanStringArray(
    parsed.materials,
  );

  const highlights = cleanStringArray(
    parsed.highlights,
  );

  if (highlights.length < 3) {
    throw new Error(
      "The AI did not return enough product highlights.",
    );
  }

  const imagePlan = validateImagePlan(
    parsed.imagePlan,
  );

  return {
    title,
    description,
    tags,
    materials,
    highlights,
    imagePlan,
  };
}

function buildPrompt(
  input: GenerateListingPackageInput,
) {
  return `
You are an expert Etsy listing strategist.

Create a complete, accurate Etsy listing package using only the product information provided below.

Product information:

Product name:
${input.productName.trim()}

Product description:
${input.productDescription.trim()}

Product type:
${input.productType?.trim() || "Not provided"}

Materials:
${input.materials?.trim() || "Not provided"}

Primary color:
${input.primaryColor?.trim() || "Not provided"}

Secondary color:
${input.secondaryColor?.trim() || "Not provided"}

Size or dimensions:
${input.dimensions?.trim() || "Not provided"}

Price:
${input.price?.trim() || "Not provided"}

Quantity:
${input.quantity?.trim() || "Not provided"}

Occasion:
${input.occasion?.trim() || "Not provided"}

Personalization:
${input.personalization?.trim() || "Not provided"}

Production time:
${input.productionTime?.trim() || "Not provided"}

Accuracy rules:

- Do not invent materials, measurements, certifications, guarantees, included items, or product features.
- Do not claim the product is handmade, vintage, sustainable, hypoallergenic, waterproof, personalized, or gift-ready unless the provided information supports it.
- Do not change the product design, color, quantity, shape, stones, beads, patterns, or included components.
- Clearly distinguish between facts and general presentation suggestions.
- Do not mention AI.
- Avoid keyword stuffing.
- Write natural buyer-friendly English.

Title rules:

- Maximum 140 characters.
- Lead with the clearest buyer-search phrase.
- Use readable phrases rather than repeated keywords.
- Do not include unsupported claims.

Description rules:

- Begin with a clear opening paragraph describing the product.
- Include a concise feature section.
- Include materials, dimensions, quantity, personalization, and production time only when provided.
- Include a short care or accuracy note only when appropriate.
- Do not include shipping promises that were not provided.

Tag rules:

- Return exactly 13 unique Etsy tags.
- Every tag must be 20 characters or fewer, including spaces.
- Use lowercase.
- Avoid duplicate or nearly identical tags.

Image plan rules:

Return exactly 6 image concepts in this order:

1. studio
2. lifestyle
3. detail
4. scale
5. gift
6. seasonal

Each image concept must include:

- type
- title
- description
- generationInstructions

The generation instructions must state that the real product must remain unchanged and must not add misleading accessories or quantities.

Return ONLY valid JSON in this exact structure:

{
  "title": "string",
  "description": "string",
  "tags": [
    "tag 1"
  ],
  "materials": [
    "material 1"
  ],
  "highlights": [
    "highlight 1"
  ],
  "imagePlan": [
    {
      "type": "studio",
      "title": "Studio hero image",
      "description": "What this image should show",
      "generationInstructions": "Detailed generation instructions"
    }
  ]
}
`;
}

export async function generateListingPackage(
  input: GenerateListingPackageInput,
): Promise<GeneratedListingPackage> {
  const productName =
    input.productName.trim();

  const productDescription =
    input.productDescription.trim();

  if (!productName) {
    throw new Error(
      "A product name is required.",
    );
  }

  if (!productDescription) {
    throw new Error(
      "A product description is required.",
    );
  }

  const response =
    await openai.responses.create({
      model: "gpt-5-mini",
      input: buildPrompt(input),
    });

  const output =
    response.output_text.trim();

  if (!output) {
    throw new Error(
      "OpenAI did not return a listing package.",
    );
  }

  return validateResponse(output);
}