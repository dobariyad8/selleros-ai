import "server-only";

import { openai } from "@/lib/ai/openai";

export type ListingImageType =
  | "studio"
  | "lifestyle"
  | "detail"
  | "scale"
  | "gift"
  | "seasonal";

export type GenerateListingImageInput = {
  sourceImage: File;
  productTitle: string;
  productDescription: string;
  imageType: ListingImageType;
  conceptTitle: string;
  conceptDescription: string;
  generationInstructions: string;
};

export type GeneratedListingImageResult = {
  imageBase64: string;
  mimeType: string;
  promptUsed: string;
};

function getFileExtension(
  mimeType: string,
) {
  if (mimeType.includes("jpeg")) {
    return "jpg";
  }

  if (mimeType.includes("webp")) {
    return "webp";
  }

  return "png";
}

function getImageSize(
  imageType: ListingImageType,
) {
  if (
    imageType === "studio" ||
    imageType === "detail"
  ) {
    return "1024x1024" as const;
  }

  return "1536x1024" as const;
}

function buildListingImagePrompt(
  input: Omit<
    GenerateListingImageInput,
    "sourceImage"
  >,
) {
  return `
Create a professional Etsy product-listing image using the uploaded product photo as the exact product reference.

Product title:
${input.productTitle.trim()}

Product description:
${input.productDescription.trim()}

Image type:
${input.imageType}

Concept title:
${input.conceptTitle.trim()}

Concept description:
${input.conceptDescription.trim()}

Additional generation instructions:
${input.generationInstructions.trim()}

Mandatory product-accuracy rules:

- Preserve the exact physical product shown in the source image.
- Do not redesign, replace, simplify, duplicate, or remove product components.
- Do not change the product's colors, shape, materials, beads, stones, thread, patterns, texture, fasteners, proportions, or quantity.
- Do not add text, logos, watermarks, labels, measurements, packaging claims, or promotional badges.
- Do not imply that decorative props are included with the purchase.
- Keep the product clearly visible and suitable for an Etsy listing.
- Use realistic professional commercial photography.
- Avoid distorted, cropped, floating, melted, or duplicated product details.
- The product must remain the primary focus.

Image-specific direction:

${getImageTypeDirection(input.imageType)}
`;
}

function getImageTypeDirection(
  imageType: ListingImageType,
) {
  switch (imageType) {
    case "studio":
      return `
Create a clean studio hero image with professional lighting, a tasteful neutral background, and soft realistic shadows.
`;

    case "lifestyle":
      return `
Place the product in a believable lifestyle setting that demonstrates presentation or use without changing the product.
`;

    case "detail":
      return `
Create a close-up product-detail composition that clearly shows craftsmanship, texture, materials, and important visual details.
`;

    case "scale":
      return `
Present the product with a realistic sense of scale. Do not invent exact measurements or add misleading measurement labels.
`;

    case "gift":
      return `
Create an elegant gift-presentation scene. Decorative packaging or props must not imply that they are included unless explicitly stated.
`;

    case "seasonal":
      return `
Create a subtle seasonal presentation related to the supplied product details or occasion. Keep decorations secondary to the real product.
`;
  }
}

export async function generateListingImage(
  input: GenerateListingImageInput,
): Promise<GeneratedListingImageResult> {
  const productTitle =
    input.productTitle.trim();

  const productDescription =
    input.productDescription.trim();

  if (!productTitle) {
    throw new Error(
      "A product title is required before generating an image.",
    );
  }

  if (!input.sourceImage.type.startsWith("image/")) {
    throw new Error(
      "The uploaded source file must be an image.",
    );
  }

  const supportedImageTypes =
    new Set<ListingImageType>([
      "studio",
      "lifestyle",
      "detail",
      "scale",
      "gift",
      "seasonal",
    ]);

  if (
    !supportedImageTypes.has(
      input.imageType,
    )
  ) {
    throw new Error(
      "A valid listing image type is required.",
    );
  }

  const sourceImageFile = new File(
    [await input.sourceImage.arrayBuffer()],
    `listing-source.${getFileExtension(
      input.sourceImage.type,
    )}`,
    {
      type:
        input.sourceImage.type ||
        "image/png",
    },
  );

  const prompt = buildListingImagePrompt({
    productTitle,
    productDescription,
    imageType: input.imageType,
    conceptTitle: input.conceptTitle,
    conceptDescription:
      input.conceptDescription,
    generationInstructions:
      input.generationInstructions,
  });

  const response =
    await openai.images.edit({
      model: "gpt-image-1",
      image: sourceImageFile,
      prompt,
      size: getImageSize(
        input.imageType,
      ),
    });

  const imageBase64 =
    response.data?.[0]?.b64_json;

  if (!imageBase64) {
    throw new Error(
      "OpenAI did not return a generated listing image.",
    );
  }

  return {
    imageBase64,
    mimeType: "image/png",
    promptUsed: prompt,
  };
}