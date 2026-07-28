import { openai } from "@/lib/ai/openai";
import {
  buildEtsyImagePrompt,
  type EtsyImageStyle,
} from "@/lib/ai/prompts";
import type { SellerOsListing } from "@/lib/etsy/types";

export type GenerateEtsyImageInput = {
  listing: Pick<
    SellerOsListing,
    "title" | "description" | "tags" | "imageUrls"
  >;
  style: EtsyImageStyle;
  customInstructions?: string;
};

export type GeneratedEtsyImageResult = {
  imageBase64: string;
  mimeType: string;
  promptUsed: string;
};

function getPrimaryImageUrl(
  imageUrls: string[],
) {
  return imageUrls
    .map((url) => url.trim())
    .find(Boolean);
}

function getImageSize(style: EtsyImageStyle) {
  if (style === "thumbnail") {
    return "1024x1024" as const;
  }

  return "1536x1024" as const;
}

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

export async function generateEtsyImage(
  input: GenerateEtsyImageInput,
): Promise<GeneratedEtsyImageResult> {
  const title = input.listing.title.trim();
  const description =
    input.listing.description?.trim() ?? "";

  if (!title) {
    throw new Error(
      "A listing title is required before generating an image.",
    );
  }

  const primaryImageUrl = getPrimaryImageUrl(
    input.listing.imageUrls ?? [],
  );

  if (!primaryImageUrl) {
    throw new Error(
      "At least one source listing image is required.",
    );
  }

  const prompt = buildEtsyImagePrompt({
    title,
    description,
    style: input.style,
    customInstructions:
      input.customInstructions,
  });

  const sourceImageResponse = await fetch(
    primaryImageUrl,
  );

  if (!sourceImageResponse.ok) {
    throw new Error(
      "The source listing image could not be downloaded.",
    );
  }

  const sourceImageBlob =
    await sourceImageResponse.blob();

  const mimeType =
    sourceImageBlob.type || "image/png";

  const sourceImageFile = new File(
    [sourceImageBlob],
    `etsy-source.${getFileExtension(
      mimeType,
    )}`,
    {
      type: mimeType,
    },
  );

  const response = await openai.images.edit({
    model: "gpt-image-1",
    image: sourceImageFile,
    prompt,
    size: getImageSize(input.style),
  });

  const imageBase64 =
    response.data?.[0]?.b64_json;

  if (!imageBase64) {
    throw new Error(
      "OpenAI did not return a generated image.",
    );
  }

  return {
    imageBase64,
    mimeType: "image/png",
    promptUsed: prompt,
  };
}