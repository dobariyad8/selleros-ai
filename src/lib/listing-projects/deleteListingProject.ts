import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";

const LISTING_IMAGE_BUCKET =
  "listing-project-images";

type DeleteListingProjectInput = {
  projectId: string;
  etsyUserId: string;
};

export type DeleteListingProjectResult = {
  projectId: string;
  deletedStorageFileCount: number;
};

export async function deleteListingProject({
  projectId,
  etsyUserId,
}: DeleteListingProjectInput): Promise<DeleteListingProjectResult> {
  const {
    data: project,
    error: projectError,
  } = await supabaseAdmin
    .from("listing_projects")
    .select("id")
    .eq("id", projectId)
    .eq(
      "etsy_user_id",
      etsyUserId,
    )
    .maybeSingle();

  if (projectError) {
    console.error(
      "Listing project ownership check failed:",
      projectError,
    );

    throw new Error(
      "The listing project could not be verified.",
    );
  }

  if (!project) {
    throw new Error(
      "The listing project was not found.",
    );
  }

  const {
    data: imageRecords,
    error: imagesError,
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
    );

  if (imagesError) {
    console.error(
      "Listing project images lookup failed:",
      imagesError,
    );

    throw new Error(
      "The listing project images could not be loaded.",
    );
  }

  const storagePaths =
    (imageRecords ?? [])
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
    const {
      error: storageDeleteError,
    } = await supabaseAdmin.storage
      .from(
        LISTING_IMAGE_BUCKET,
      )
      .remove(storagePaths);

    if (storageDeleteError) {
      console.error(
        "Listing project Storage deletion failed:",
        storageDeleteError,
      );

      throw new Error(
        "The listing project image files could not be deleted.",
      );
    }
  }

  const {
    error: projectDeleteError,
  } = await supabaseAdmin
    .from("listing_projects")
    .delete()
    .eq(
      "id",
      projectId,
    )
    .eq(
      "etsy_user_id",
      etsyUserId,
    );

  if (projectDeleteError) {
    console.error(
      "Listing project deletion failed:",
      projectDeleteError,
    );

    throw new Error(
      "The listing project could not be deleted.",
    );
  }

  return {
    projectId,
    deletedStorageFileCount:
      storagePaths.length,
  };
}