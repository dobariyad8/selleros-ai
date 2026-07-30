import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";

export type ListingProjectStatus =
  | "draft"
  | "generating"
  | "ready"
  | "exporting"
  | "exported"
  | "failed";

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

export type CreateListingProjectInput = {
  etsyUserId: string;
  productName: string;
  productDescription: string;
  productType?: string;
  sourceMaterials?: string;
  primaryColor?: string;
  secondaryColor?: string;
  dimensions?: string;
  price?: string;
  quantity?: string;
  occasion?: string;
  personalization?: string;
  productionTime?: string;
};

export type UpdateGeneratedListingInput = {
  projectId: string;
  etsyUserId: string;
  generatedTitle: string;
  generatedDescription: string;
  generatedTags: string[];
  generatedMaterials: string[];
  generatedHighlights: string[];
  imagePlan: ListingImagePlanItem[];
  status?: ListingProjectStatus;
};

export type SaveListingProjectChangesInput = {
  projectId: string;
  etsyUserId: string;

  productName: string;
  productDescription: string;
  productType?: string;
  sourceMaterials?: string;
  primaryColor?: string;
  secondaryColor?: string;
  dimensions?: string;
  price?: string;
  quantity?: string;
  occasion?: string;
  personalization?: string;
  productionTime?: string;

  generatedTitle: string;
  generatedDescription: string;
  generatedTags: string[];
  generatedMaterials: string[];
  generatedHighlights: string[];
  imagePlan: ListingImagePlanItem[];
};

export type ListingProject = {
  id: string;
  etsy_user_id: string;
  status: ListingProjectStatus;
  product_name: string;
  product_description: string;
  product_type: string | null;
  source_materials: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  dimensions: string | null;
  price: number | null;
  quantity: number;
  occasion: string | null;
  personalization: string | null;
  production_time: string | null;
  generated_title: string | null;
  generated_description: string | null;
  generated_tags: string[];
  generated_materials: string[];
  generated_highlights: string[];
  image_plan: ListingImagePlanItem[];
  etsy_listing_id: number | null;
  etsy_listing_url: string | null;
  created_at: string;
  updated_at: string;
};

function cleanRequiredText(
  value: string,
  fieldName: string,
) {
  const cleanedValue = value.trim();

  if (!cleanedValue) {
    throw new Error(
      `${fieldName} is required.`,
    );
  }

  return cleanedValue;
}

function cleanOptionalText(
  value?: string,
) {
  const cleanedValue = value?.trim();

  return cleanedValue || null;
}

function parsePrice(
  value?: string,
) {
  const cleanedValue = value?.trim();

  if (!cleanedValue) {
    return null;
  }

  const price = Number(cleanedValue);

  if (
    !Number.isFinite(price) ||
    price < 0
  ) {
    throw new Error(
      "Price must be a valid non-negative number.",
    );
  }

  return price;
}

function parseQuantity(
  value?: string,
) {
  const cleanedValue = value?.trim();

  if (!cleanedValue) {
    return 1;
  }

  const quantity = Number(cleanedValue);

  if (
    !Number.isInteger(quantity) ||
    quantity < 1
  ) {
    throw new Error(
      "Quantity must be a whole number of at least 1.",
    );
  }

  return quantity;
}

export async function createListingProject(
  input: CreateListingProjectInput,
): Promise<ListingProject> {
  const etsyUserId =
    cleanRequiredText(
      input.etsyUserId,
      "Etsy user ID",
    );

  const productName =
    cleanRequiredText(
      input.productName,
      "Product name",
    );

  const productDescription =
    cleanRequiredText(
      input.productDescription,
      "Product description",
    );

  const { data, error } =
    await supabaseAdmin
      .from("listing_projects")
      .insert({
        etsy_user_id: etsyUserId,
        status: "draft",
        product_name: productName,
        product_description:
          productDescription,
        product_type:
          cleanOptionalText(
            input.productType,
          ),
        source_materials:
          cleanOptionalText(
            input.sourceMaterials,
          ),
        primary_color:
          cleanOptionalText(
            input.primaryColor,
          ),
        secondary_color:
          cleanOptionalText(
            input.secondaryColor,
          ),
        dimensions:
          cleanOptionalText(
            input.dimensions,
          ),
        price: parsePrice(input.price),
        quantity: parseQuantity(
          input.quantity,
        ),
        occasion:
          cleanOptionalText(
            input.occasion,
          ),
        personalization:
          cleanOptionalText(
            input.personalization,
          ),
        production_time:
          cleanOptionalText(
            input.productionTime,
          ),
      })
      .select("*")
      .single<ListingProject>();

  if (error) {
    console.error(
      "Listing project creation failed:",
      error,
    );

    throw new Error(
      "The listing project could not be created.",
    );
  }

  return data;
}

export async function updateGeneratedListing(
  input: UpdateGeneratedListingInput,
): Promise<ListingProject> {
  const projectId =
    cleanRequiredText(
      input.projectId,
      "Project ID",
    );

  const etsyUserId =
    cleanRequiredText(
      input.etsyUserId,
      "Etsy user ID",
    );

  const generatedTitle =
    cleanRequiredText(
      input.generatedTitle,
      "Generated title",
    );

  const generatedDescription =
    cleanRequiredText(
      input.generatedDescription,
      "Generated description",
    );

  const { data, error } =
    await supabaseAdmin
      .from("listing_projects")
      .update({
        generated_title:
          generatedTitle,
        generated_description:
          generatedDescription,
        generated_tags:
          input.generatedTags,
        generated_materials:
          input.generatedMaterials,
        generated_highlights:
          input.generatedHighlights,
        image_plan:
          input.imagePlan,
        status:
          input.status ?? "ready",
      })
      .eq("id", projectId)
      .eq(
        "etsy_user_id",
        etsyUserId,
      )
      .select("*")
      .single<ListingProject>();

  if (error) {
    console.error(
      "Generated listing update failed:",
      error,
    );

    throw new Error(
      "The generated listing could not be saved.",
    );
  }

  return data;
}

export async function saveListingProjectChanges(
  input: SaveListingProjectChangesInput,
): Promise<ListingProject> {
  const projectId =
    cleanRequiredText(
      input.projectId,
      "Project ID",
    );

  const etsyUserId =
    cleanRequiredText(
      input.etsyUserId,
      "Etsy user ID",
    );

  const productName =
    cleanRequiredText(
      input.productName,
      "Product name",
    );

  const productDescription =
    cleanRequiredText(
      input.productDescription,
      "Product description",
    );

  const generatedTitle =
    cleanRequiredText(
      input.generatedTitle,
      "Generated title",
    );

  const generatedDescription =
    cleanRequiredText(
      input.generatedDescription,
      "Generated description",
    );

  if (
    input.generatedTags.length !== 13
  ) {
    throw new Error(
      "Exactly 13 Etsy tags are required.",
    );
  }

  const cleanedTags =
    input.generatedTags.map(
      (tag, index) => {
        const cleanedTag =
          cleanRequiredText(
            tag,
            `Tag ${index + 1}`,
          );

        if (
          cleanedTag.length > 20
        ) {
          throw new Error(
            `Tag ${index + 1} must be 20 characters or fewer.`,
          );
        }

        return cleanedTag;
      },
    );

  if (
    new Set(
      cleanedTags.map((tag) =>
        tag.toLowerCase(),
      ),
    ).size !== cleanedTags.length
  ) {
    throw new Error(
      "Etsy tags must be unique.",
    );
  }

  if (
    input.imagePlan.length !== 6
  ) {
    throw new Error(
      "Exactly 6 image-plan items are required.",
    );
  }

  const { data, error } =
    await supabaseAdmin
      .from("listing_projects")
      .update({
        product_name:
          productName,
        product_description:
          productDescription,
        product_type:
          cleanOptionalText(
            input.productType,
          ),
        source_materials:
          cleanOptionalText(
            input.sourceMaterials,
          ),
        primary_color:
          cleanOptionalText(
            input.primaryColor,
          ),
        secondary_color:
          cleanOptionalText(
            input.secondaryColor,
          ),
        dimensions:
          cleanOptionalText(
            input.dimensions,
          ),
        price:
          parsePrice(
            input.price,
          ),
        quantity:
          parseQuantity(
            input.quantity,
          ),
        occasion:
          cleanOptionalText(
            input.occasion,
          ),
        personalization:
          cleanOptionalText(
            input.personalization,
          ),
        production_time:
          cleanOptionalText(
            input.productionTime,
          ),

        generated_title:
          generatedTitle,
        generated_description:
          generatedDescription,
        generated_tags:
          cleanedTags,
        generated_materials:
          input.generatedMaterials
            .map((item) =>
              item.trim(),
            )
            .filter(Boolean),
        generated_highlights:
          input.generatedHighlights
            .map((item) =>
              item.trim(),
            )
            .filter(Boolean),
        image_plan:
          input.imagePlan,
        status: "ready",
      })
      .eq(
        "id",
        projectId,
      )
      .eq(
        "etsy_user_id",
        etsyUserId,
      )
      .select("*")
      .single<ListingProject>();

  if (error) {
    console.error(
      "Listing project save failed:",
      error,
    );

    throw new Error(
      "The listing project changes could not be saved.",
    );
  }

  return data;
}