export function buildTitleRewritePrompt(
  title: string,
) {
  return `
You are an Etsy SEO expert.

Rewrite the following Etsy listing title.

Requirements:

- Keep under 140 characters.
- Preserve the product meaning.
- Prioritize the most important keywords first.
- Avoid keyword stuffing.
- Make it natural to read.
- Optimize for Etsy search.

Current title:

${title}

Return ONLY the improved title.
`;
}

export function buildDescriptionRewritePrompt(
  title: string,
  description: string,
) {
  return `
You are an Etsy listing optimization expert.

Rewrite the Etsy product description below.

Requirements:

- Preserve all factual product information.
- Do not invent materials, dimensions, shipping times, personalization options, or other details.
- Start with a clear product overview.
- Use natural buyer-friendly language.
- Organize the description into short sections.
- Use bullet points for important product details.
- Improve readability and purchase confidence.
- Naturally reinforce relevant words from the listing title.
- Avoid keyword stuffing.
- Do not include commentary about the rewrite.

Listing title:

${title}

Current description:

${description}

Return ONLY the improved product description.
`;
}

export function buildTagGenerationPrompt(
  title: string,
  description: string,
  currentTags: string[] = [],
) {
  const formattedCurrentTags =
    currentTags.length > 0
      ? currentTags.join(", ")
      : "No current tags provided.";

  return `
You are an Etsy SEO and buyer-search expert.

Generate 13 unique search tags for the Etsy listing below.

Requirements:

- Preserve the actual product meaning.
- Do not invent product details.
- Use phrases that reflect how buyers may search.
- Prioritize specific multi-word phrases over broad single words.
- Include a useful mix of:
  - product type
  - recipient
  - occasion
  - style
  - gifting intent
- Avoid duplicate or nearly identical tags.
- Avoid unnecessary repetition across tags.
- Use the title and description as the source of truth.
- Improve weak current tags rather than blindly copying them.
- Return exactly 13 tags.
- Return ONLY a valid JSON array of strings.
- Do not include markdown, numbering, or commentary.

Listing title:

${title}

Listing description:

${description}

Current tags:

${formattedCurrentTags}
`;
}

export type EtsyImageStyle =
  | "studio"
  | "lifestyle"
  | "gift"
  | "seasonal"
  | "thumbnail";

export function buildEtsyImagePrompt({
  title,
  description,
  style,
  customInstructions,
}: {
  title: string;
  description?: string;
  style: EtsyImageStyle;
  customInstructions?: string;
}) {
  const styleInstructions: Record<
    EtsyImageStyle,
    string
  > = {
    studio: `
Create a clean professional studio product photograph.

- Use a simple neutral background.
- Use soft commercial studio lighting.
- Keep the product centered and clearly visible.
- Create a polished Etsy hero-image composition.
`,
    lifestyle: `
Create a realistic lifestyle product photograph.

- Place the product in a natural setting where it would reasonably be used.
- Keep the product as the primary focus.
- Use soft natural-looking lighting.
- Do not add unsupported product features or accessories.
`,
    gift: `
Create an elegant gift-presentation photograph.

- Present the product in a tasteful gifting scene.
- Use subtle gift-related styling around the product.
- Do not imply that packaging or accessories are included unless they appear in the source image.
- Keep the real product clearly visible.
`,
    seasonal: `
Create a tasteful seasonal Etsy product photograph.

- Add subtle seasonal styling around the product.
- Keep the scene commercially usable and uncluttered.
- Do not cover important product details.
- Do not change the product itself.
`,
    thumbnail: `
Create a high-converting Etsy listing thumbnail.

- Use a clean, uncluttered composition.
- Make the product large and easy to recognize at small size.
- Use clear separation between the product and background.
- Avoid text, badges, logos, and decorative overlays.
`,
  };

  const cleanedDescription =
    description?.trim() ||
    "No product description was provided.";

  const cleanedCustomInstructions =
    customInstructions?.trim() ||
    "No additional instructions.";

  return `
Create an Etsy-ready product listing image using the supplied product photo as the source of truth.

Product title:

${title.trim()}

Product description:

${cleanedDescription}

Selected image style:

${style}

Style requirements:

${styleInstructions[style]}

Product-preservation requirements:

- Preserve the exact product design, shape, structure, colors, materials, patterns, proportions, and visible details from the source image.
- Do not redesign, simplify, replace, duplicate, remove, or invent any part of the product.
- Do not change the number of products shown.
- Do not create a different variation, color, material, size, engraving, personalization, or accessory.
- Do not add branding, logos, labels, text, watermarks, pricing, or promotional badges.
- Do not imply that props, packaging, or accessories are included with the purchase.
- Improve only the presentation, lighting, background, and composition.
- Keep the final result realistic and commercially suitable for an Etsy listing.

Additional seller instructions:

${cleanedCustomInstructions}
`;
}