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