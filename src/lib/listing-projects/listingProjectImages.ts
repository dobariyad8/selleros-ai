import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";

const LISTING_IMAGE_BUCKET =
  "listing-project-images";

export type ListingProjectImageKind =
  | "source"
  | "studio"
  | "lifestyle"
  | "detail"
  | "scale"
  | "gift"
  | "seasonal";

export type ListingProjectImageStatus =
  | "pending"
  | "generating"
  | "complete"
  | "failed";

export type SaveListingProjectImageInput = {
  projectId: string;
  etsyUserId: string;
  imageKind: ListingProjectImageKind;
  imageRank: number;
  file: File;
  originalFilename?: string;
  conceptTitle?: string;
  conceptDescription?: string;
  generationInstructions?: string;
  promptUsed?: string;
  altText?: string;
  generationStatus?: ListingProjectImageStatus;
  errorMessage?: string;
};

export type ListingProjectImage = {
  id: string;
  project_id: string;
  etsy_user_id: string;
  image_kind: ListingProjectImageKind;
  image_rank: number;
  storage_path: string | null;
  mime_type: string | null;
  original_filename: string | null;
  concept_title: string | null;
  concept_description: string | null;
  generation_instructions: string | null;
  prompt_used: string | null;
  alt_text: string | null;
  generation_status: ListingProjectImageStatus;
  error_message: string | null;
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

function getFileExtension(
  file: File,
) {
  if (file.type.includes("jpeg")) {
    return "jpg";
  }

  if (file.type.includes("webp")) {
    return "webp";
  }

  return "png";
}

function buildStoragePath({
  etsyUserId,
  projectId,
  imageKind,
  imageRank,
  extension,
}: {
  etsyUserId: string;
  projectId: string;
  imageKind: ListingProjectImageKind;
  imageRank: number;
  extension: string;
}) {
  const timestamp = Date.now();

  return [
    etsyUserId,
    projectId,
    `${imageKind}-${imageRank}-${timestamp}.${extension}`,
  ].join("/");
}

export async function saveListingProjectImage(
  input: SaveListingProjectImageInput,
): Promise<ListingProjectImage> {
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

  if (
    !Number.isInteger(input.imageRank) ||
    input.imageRank < 1
  ) {
    throw new Error(
      "Image rank must be a whole number of at least 1.",
    );
  }

  if (
    !input.file.type.startsWith("image/")
  ) {
    throw new Error(
      "The uploaded file must be an image.",
    );
  }

  const {
  data: existingImage,
  error: existingImageError,
} = await supabaseAdmin
  .from("listing_project_images")
  .select("storage_path")
  .eq(
    "project_id",
    projectId,
  )
  .eq(
    "etsy_user_id",
    etsyUserId,
  )
  .eq(
    "image_kind",
    input.imageKind,
  )
  .eq(
    "image_rank",
    input.imageRank,
  )
  .maybeSingle();

if (existingImageError) {
  console.error(
    "Existing listing image lookup failed:",
    existingImageError,
  );

  throw new Error(
    "The existing listing image could not be checked.",
  );
}

const previousStoragePath =
  existingImage?.storage_path ?? null;

  const extension =
    getFileExtension(input.file);

  const storagePath =
    buildStoragePath({
      etsyUserId,
      projectId,
      imageKind: input.imageKind,
      imageRank: input.imageRank,
      extension,
    });

  const fileBuffer =
    await input.file.arrayBuffer();

  const { error: uploadError } =
    await supabaseAdmin.storage
      .from(LISTING_IMAGE_BUCKET)
      .upload(
        storagePath,
        fileBuffer,
        {
          contentType:
            input.file.type ||
            "image/png",
          upsert: false,
        },
      );

  if (uploadError) {
    console.error(
      "Listing project image upload failed:",
      uploadError,
    );

    throw new Error(
      "The listing project image could not be uploaded.",
    );
  }

  const { data, error } =
    await supabaseAdmin
      .from(
        "listing_project_images",
      )
      .upsert(
        {
          project_id: projectId,
          etsy_user_id: etsyUserId,
          image_kind: input.imageKind,
          image_rank: input.imageRank,
          storage_path: storagePath,
          mime_type:
            input.file.type ||
            "image/png",
          original_filename:
            cleanOptionalText(
              input.originalFilename ??
                input.file.name,
            ),
          concept_title:
            cleanOptionalText(
              input.conceptTitle,
            ),
          concept_description:
            cleanOptionalText(
              input.conceptDescription,
            ),
          generation_instructions:
            cleanOptionalText(
              input.generationInstructions,
            ),
          prompt_used:
            cleanOptionalText(
              input.promptUsed,
            ),
          alt_text:
            cleanOptionalText(
              input.altText,
            ),
          generation_status:
            input.generationStatus ??
            "complete",
          error_message:
            cleanOptionalText(
              input.errorMessage,
            ),
        },
        {
          onConflict:
            "project_id,image_kind,image_rank",
        },
      )
      .select("*")
      .single<ListingProjectImage>();

  if (error) {
  console.error(
    "Listing project image record save failed:",
    error,
  );

  await supabaseAdmin.storage
    .from(LISTING_IMAGE_BUCKET)
    .remove([storagePath]);

  throw new Error(
    "The listing project image record could not be saved.",
  );
}

if (
  previousStoragePath &&
  previousStoragePath !== storagePath
) {
  const {
    error: previousFileDeleteError,
  } = await supabaseAdmin.storage
    .from(LISTING_IMAGE_BUCKET)
    .remove([
      previousStoragePath,
    ]);

  if (previousFileDeleteError) {
    console.error(
      "Previous listing image file deletion failed:",
      previousFileDeleteError,
    );
  }
}

return data;
}

export async function getListingProjectImageSignedUrl(
  storagePath: string,
) {
  const cleanedStoragePath =
    cleanRequiredText(
      storagePath,
      "Storage path",
    );

  const { data, error } =
    await supabaseAdmin.storage
      .from(LISTING_IMAGE_BUCKET)
      .createSignedUrl(
        cleanedStoragePath,
        60 * 60,
      );

  if (error) {
    console.error(
      "Listing project image signed URL failed:",
      error,
    );

    throw new Error(
      "The listing project image could not be loaded.",
    );
  }

  return data.signedUrl;
}

export async function deleteListingProjectImagesByKind({
  projectId,
  etsyUserId,
  imageKind,
}: {
  projectId: string;
  etsyUserId: string;
  imageKind: ListingProjectImageKind;
}) {
  const cleanedProjectId =
    cleanRequiredText(
      projectId,
      "Project ID",
    );

  const cleanedEtsyUserId =
    cleanRequiredText(
      etsyUserId,
      "Etsy user ID",
    );

  const {
    data: existingImages,
    error: loadError,
  } = await supabaseAdmin
    .from("listing_project_images")
    .select("id, storage_path")
    .eq(
      "project_id",
      cleanedProjectId,
    )
    .eq(
      "etsy_user_id",
      cleanedEtsyUserId,
    )
    .eq(
      "image_kind",
      imageKind,
    );

  if (loadError) {
    console.error(
      "Existing listing images load failed:",
      loadError,
    );

    throw new Error(
      "The existing listing images could not be loaded.",
    );
  }

  const storagePaths =
    (existingImages ?? [])
      .map(
        (image) =>
          image.storage_path,
      )
      .filter(
        (
          storagePath,
        ): storagePath is string =>
          typeof storagePath ===
            "string" &&
          storagePath.length > 0,
      );

  if (storagePaths.length > 0) {
    const { error: storageError } =
      await supabaseAdmin.storage
        .from(
          LISTING_IMAGE_BUCKET,
        )
        .remove(storagePaths);

    if (storageError) {
      console.error(
        "Existing listing image files deletion failed:",
        storageError,
      );

      throw new Error(
        "The existing listing image files could not be removed.",
      );
    }
  }

  const { error: deleteError } =
    await supabaseAdmin
      .from(
        "listing_project_images",
      )
      .delete()
      .eq(
        "project_id",
        cleanedProjectId,
      )
      .eq(
        "etsy_user_id",
        cleanedEtsyUserId,
      )
      .eq(
        "image_kind",
        imageKind,
      );

  if (deleteError) {
    console.error(
      "Existing listing image records deletion failed:",
      deleteError,
    );

    throw new Error(
      "The existing listing image records could not be removed.",
    );
  }
}