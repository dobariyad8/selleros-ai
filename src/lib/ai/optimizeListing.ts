import { generateTags } from "@/lib/ai/generateTags";
import { rewriteDescription } from "@/lib/ai/rewriteDescription";
import { rewriteTitle } from "@/lib/ai/rewriteTitle";

export type OptimizeListingInput = {
  title: string;
  description?: string;
  tags?: string[];
};

export type OptimizedListingContent = {
  title: string;
  description: string;
  tags: string[];
};

export async function optimizeListing(
  input: OptimizeListingInput,
): Promise<OptimizedListingContent> {
  const currentTitle = input.title.trim();

  const currentDescription =
    input.description?.trim() ?? "";

  const currentTags = (input.tags ?? [])
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (!currentTitle) {
    throw new Error(
      "A listing title is required before optimization.",
    );
  }

  const optimizedTitle =
    await rewriteTitle(currentTitle);

  let optimizedDescription = "";

  if (currentDescription) {
    optimizedDescription =
      await rewriteDescription(
        optimizedTitle,
        currentDescription,
      );
  }

  const optimizedTags = await generateTags(
    optimizedTitle,
    optimizedDescription || currentDescription,
    currentTags,
  );

  return {
    title: optimizedTitle,
    description: optimizedDescription,
    tags: optimizedTags,
  };
}