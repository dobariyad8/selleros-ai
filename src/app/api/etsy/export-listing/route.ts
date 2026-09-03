import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  applyEtsyAuthCookies,
  type EtsyAuthSession,
} from "@/lib/etsy/auth";
import {
  EtsyApiError,
} from "@/lib/etsy/client";
import {
  createEtsyRepository,
} from "@/lib/etsy/createRepository";
import {
  supabaseAdmin,
} from "@/lib/supabase/server";

import {
  deleteListingProject,
} from "@/lib/listing-projects/deleteListingProject";

import {
  requireProSubscription,
  SubscriptionAccessError,
} from "@/lib/billing/requireProSubscription";

import type {
  EtsyRepository,
} from "@/lib/etsy/repository";

export const runtime = "nodejs";

const LISTING_IMAGE_BUCKET =
  "listing-project-images";

const GENERATED_IMAGE_KINDS = [
  "studio",
  "lifestyle",
  "detail",
  "scale",
  "gift",
  "seasonal",
] as const;

type ExportListingRequest = {
  projectId?: unknown;
  taxonomyId?: unknown;
  shippingProfileId?: unknown;
  readinessStateId?: unknown;

  itemWeight?: unknown;
  itemWeightUnit?: unknown;
  itemLength?: unknown;
  itemWidth?: unknown;
  itemHeight?: unknown;
  itemDimensionsUnit?: unknown;

  whoMade?: unknown;
  whenMade?: unknown;
  isSupply?: unknown;
  shouldAutoRenew?: unknown;
};

type ListingProjectRow = {
  id: string;
  status: string;
  price: number | string | null;
  quantity: number | null;
  generated_title: string | null;
  generated_description: string | null;
  generated_tags: unknown;
  generated_materials: unknown;
  etsy_listing_id: number | null;
  etsy_listing_url: string | null;
};

type ListingProjectImageRow = {
  id: string;
  image_kind: string;
  image_rank: number;
  storage_path: string | null;
  mime_type: string | null;
  original_filename: string | null;
  alt_text: string | null;
  generation_status: string;
};

function isValidUuid(
  value: string,
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function readText(
  value: unknown,
) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function readPositiveInteger(
  value: unknown,
  fieldName: string,
) {
  const parsedValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue < 1
  ) {
    throw new Error(
      `${fieldName} must be a valid positive number.`,
    );
  }

  return parsedValue;
}

function readPositiveNumber(
  value: unknown,
  fieldName: string,
) {
  const parsedValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  if (
    !Number.isFinite(parsedValue) ||
    parsedValue <= 0
  ) {
    throw new Error(
      `${fieldName} must be greater than 0.`,
    );
  }

  return parsedValue;
}

function readStringArray(
  value: unknown,
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (
        item,
      ): item is string =>
        typeof item === "string",
    )
    .map((item) => item.trim())
    .filter(Boolean);
}

function getImageFilename(
  image: ListingProjectImageRow,
) {
  const originalFilename =
    image.original_filename?.trim();

  if (originalFilename) {
    return originalFilename;
  }

  const extension =
    image.mime_type === "image/jpeg"
      ? "jpg"
      : image.mime_type === "image/webp"
        ? "webp"
        : "png";

  return `${image.image_kind}-${image.image_rank}.${extension}`;
}

function createErrorResponse(
  error: unknown,
) {
  if (error instanceof EtsyApiError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        etsyStatus: error.status,
      },
      {
        status: error.status,
      },
    );
  }

  const message =
    error instanceof Error
      ? error.message
      : "The Etsy draft could not be created.";

  const isBadRequest =
    message.includes("required") ||
    message.includes("valid") ||
    message.includes("must be") ||
    message.includes("already been exported") ||
    message.includes("at least one completed");

  const isNotFound =
    message.includes("not found");

  const isAuthenticationError =
    message.includes("Connect your Etsy shop") ||
    message.includes("access token") ||
    message.includes("connection has expired");

  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    {
      status: isAuthenticationError
        ? 401
        : isNotFound
          ? 404
          : isBadRequest
            ? 400
            : 500,
    },
  );
}

export async function POST(
  request: NextRequest,
) {
  let authSession:
    | EtsyAuthSession
    | null = null;

  let projectId = "";
  let createdListingId:
    | number
    | null = null;
  let etsyRepository:
      | EtsyRepository
      | null = null;

  try {
    await requireProSubscription();

    const body =
      (await request.json()) as ExportListingRequest;

    projectId =
      readText(body.projectId);

    if (
      !projectId ||
      !isValidUuid(projectId)
    ) {
      throw new Error(
        "A valid listing project ID is required.",
      );
    }

    const taxonomyId =
      readPositiveInteger(
        body.taxonomyId,
        "Etsy category",
      );

    const shippingProfileId =
      readPositiveInteger(
        body.shippingProfileId,
        "Shipping profile",
      );

    const readinessStateId =
      readPositiveInteger(
        body.readinessStateId,
        "Processing profile",
      );

      const itemWeight =
       readPositiveNumber(
         body.itemWeight,
         "Item weight",
       );
     
     const itemLength =
       readPositiveNumber(
         body.itemLength,
         "Package length",
       );
     
     const itemWidth =
       readPositiveNumber(
         body.itemWidth,
         "Package width",
       );
     
     const itemHeight =
       readPositiveNumber(
         body.itemHeight,
         "Package height",
       );
     
     const itemWeightUnit =
       readText(
         body.itemWeightUnit,
       );
     
     const allowedWeightUnits = [
       "oz",
       "lb",
       "g",
       "kg",
     ] as const;
     
     if (
       !allowedWeightUnits.includes(
         itemWeightUnit as
           (typeof allowedWeightUnits)[number],
       )
     ) {
       throw new Error(
         "A valid item weight unit is required.",
       );
     }
     
     const itemDimensionsUnit =
       readText(
         body.itemDimensionsUnit,
       );
     
     const allowedDimensionUnits = [
       "in",
       "ft",
       "mm",
       "cm",
       "m",
       "yd",
       "inches",
     ] as const;
     
     if (
       !allowedDimensionUnits.includes(
         itemDimensionsUnit as
           (typeof allowedDimensionUnits)[number],
       )
     ) {
       throw new Error(
         "A valid package dimensions unit is required.",
       );
     }

    const whoMade =
      readText(body.whoMade);

    if (
      whoMade !== "i_did" &&
      whoMade !== "collective" &&
      whoMade !== "someone_else"
    ) {
      throw new Error(
        "A valid who-made selection is required.",
      );
    }

    const whenMade =
      readText(body.whenMade);

    if (!whenMade) {
      throw new Error(
        "A when-made selection is required.",
      );
    }

    if (
      typeof body.isSupply !== "boolean"
    ) {
      throw new Error(
        "A valid supply selection is required.",
      );
    }

    const {
      repository,
      authSession:
        repositoryAuthSession,
    } =
      await createEtsyRepository(
        request,
      );

    etsyRepository = repository;

    authSession =
      repositoryAuthSession;

    const etsyUserId =
      authSession.userId;

    const {
      data: projectData,
      error: projectError,
    } = await supabaseAdmin
      .from("listing_projects")
      .select(
        `
          id,
          status,
          price,
          quantity,
          generated_title,
          generated_description,
          generated_tags,
          generated_materials,
          etsy_listing_id,
          etsy_listing_url
        `,
      )
      .eq("id", projectId)
      .eq(
        "etsy_user_id",
        etsyUserId,
      )
      .maybeSingle();

    if (projectError) {
      console.error(
        "Etsy export project load failed:",
        projectError,
      );

      throw new Error(
        "The listing project could not be loaded.",
      );
    }

    if (!projectData) {
      throw new Error(
        "The listing project was not found.",
      );
    }

    const project =
      projectData as ListingProjectRow;

    if (project.etsy_listing_id) {
      throw new Error(
        "This listing project has already been exported to Etsy.",
      );
    }

    const title =
      project.generated_title?.trim() ??
      "";

    const description =
      project.generated_description?.trim() ??
      "";

    if (!title) {
      throw new Error(
        "A generated listing title is required.",
      );
    }

    if (!description) {
      throw new Error(
        "A generated listing description is required.",
      );
    }

    const price =
      project.price === null
        ? ""
        : String(project.price).trim();

    const numericPrice =
      Number(price);

    if (
      !price ||
      !Number.isFinite(
        numericPrice,
      ) ||
      numericPrice <= 0
    ) {
      throw new Error(
        "A valid listing price is required.",
      );
    }

    const quantity =
      project.quantity ?? 1;

    if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      throw new Error(
        "A valid listing quantity is required.",
      );
    }

    const {
      data: imageData,
      error: imagesError,
    } = await supabaseAdmin
      .from(
        "listing_project_images",
      )
      .select(
        `
          id,
          image_kind,
          image_rank,
          storage_path,
          mime_type,
          original_filename,
          alt_text,
          generation_status
        `,
      )
      .eq(
        "project_id",
        projectId,
      )
      .eq(
        "etsy_user_id",
        etsyUserId,
      )
      .neq(
        "image_kind",
        "source",
      )
      .eq(
        "generation_status",
        "complete",
      )
      .order(
        "image_rank",
        {
          ascending: true,
        },
      );

    if (imagesError) {
      console.error(
        "Etsy export image load failed:",
        imagesError,
      );

      throw new Error(
        "The generated listing images could not be loaded.",
      );
    }

    const generatedImages =
      (
        imageData ??
        []
      )
        .filter((image) =>
          GENERATED_IMAGE_KINDS.includes(
            image.image_kind as
              (typeof GENERATED_IMAGE_KINDS)[number],
          ),
        )
        .filter(
          (image) =>
            Boolean(
              image.storage_path,
            ),
        ) as ListingProjectImageRow[];

    if (
      generatedImages.length < 1
    ) {
      throw new Error(
        "Generate at least one completed listing image before Etsy export.",
      );
    }

    await supabaseAdmin
      .from("listing_projects")
      .update({
        status: "exporting",
      })
      .eq("id", projectId)
      .eq(
        "etsy_user_id",
        etsyUserId,
      );

    const shop =
      await repository.getShop();

    const draft =
      await repository.createDraftListing({
        shopId: shop.shopId,
        quantity,
        title,
        description,
        price,
        taxonomyId,
        shippingProfileId,
        readinessStateId,
        itemWeight,
        itemWeightUnit:
          itemWeightUnit as
            (typeof allowedWeightUnits)[number],

        itemLength,
        itemWidth,
        itemHeight,

        itemDimensionsUnit:
          itemDimensionsUnit as
            (typeof allowedDimensionUnits)[number],
        whoMade,
        whenMade,
        isSupply:
          body.isSupply,
        tags:
          readStringArray(
            project.generated_tags,
          ),
        materials:
          readStringArray(
            project.generated_materials,
          ),
        shouldAutoRenew:
          typeof body.shouldAutoRenew ===
          "boolean"
            ? body.shouldAutoRenew
            : false,
      });

    createdListingId =
      draft.listing_id;

    if (!createdListingId) {
      throw new Error(
        "Etsy did not return a listing ID for the new draft.",
      );
    }

    await supabaseAdmin
      .from("listing_projects")
      .update({
        etsy_listing_id:
          createdListingId,
        etsy_listing_url:
          draft.url ?? null,
      })
      .eq("id", projectId)
      .eq(
        "etsy_user_id",
        etsyUserId,
      );

    for (
      let index = 0;
      index <
      generatedImages.length;
      index += 1
    ) {
      const image =
        generatedImages[index];

      if (!image.storage_path) {
        throw new Error(
          `Generated image ${
            index + 1
          } is missing its storage path.`,
        );
      }

      const {
        data: imageBlob,
        error: downloadError,
      } =
        await supabaseAdmin.storage
          .from(
            LISTING_IMAGE_BUCKET,
          )
          .download(
            image.storage_path,
          );

      if (
        downloadError ||
        !imageBlob
      ) {
        console.error(
          "Etsy export image download failed:",
          {
            imageId: image.id,
            storagePath:
              image.storage_path,
            downloadError,
          },
        );

        throw new Error(
          `Generated image ${
            index + 1
          } could not be downloaded.`,
        );
      }

      const mimeType =
        image.mime_type ||
        imageBlob.type ||
        "image/png";

      const imageFile =
        new File(
          [imageBlob],
          getImageFilename(image),
          {
            type: mimeType,
          },
        );

      await repository.uploadListingImage({
        shopId:
          shop.shopId,
        listingId:
          createdListingId,
        image:
          imageFile,
        rank:
          index + 1,
        altText:
          image.alt_text ??
          undefined,
        overwrite: false,
        isWatermarked: false,
      });
    }

    const {
      data: historyData,
      error: historyError,
    } = await supabaseAdmin
      .from("etsy_export_history")
      .insert({
        etsy_user_id:
          etsyUserId,
        source_project_id:
          projectId,
        etsy_shop_id:
          shop.shopId,
        etsy_shop_name:
          shop.shopName,
        etsy_listing_id:
          createdListingId,
        listing_title:
          title,
        listing_url:
          draft.url ?? null,
        uploaded_image_count:
          generatedImages.length,
        etsy_state:
          draft.state ?? "draft",
        project_cleanup_completed:
          false,
      })
      .select("id")
      .single();
  
    if (
      historyError ||
      !historyData
    ) {
      console.error(
        "Etsy export history save failed:",
        historyError,
      );
  
      throw new Error(
        "The Etsy draft was created, but its export history could not be saved.",
      );
    }
    
    const exportHistoryId =
      historyData.id as string;
    
    let projectDeleted =
      false;
    
    let deletedStorageFileCount =
      0;
    
    let projectCleanupError:
      string | null = null;
    
    /*
     * Project cleanup is handled separately from the Etsy export.
     * A cleanup failure must not delete the completed Etsy draft.
     */
    try {
      const cleanupResult =
        await deleteListingProject({
          projectId,
          etsyUserId,
        });
    
      projectDeleted =
        true;
    
      deletedStorageFileCount =
        cleanupResult.deletedStorageFileCount;
    } catch (cleanupError) {
      projectCleanupError =
        cleanupError instanceof Error
          ? cleanupError.message
          : "The SellerOS project cleanup failed.";
    
      console.error(
        "Exported listing project cleanup failed:",
        {
          projectId,
          exportHistoryId,
          listingId:
            createdListingId,
          cleanupError,
        },
      );
    }
    
    const {
      error: historyUpdateError,
    } = await supabaseAdmin
      .from("etsy_export_history")
      .update({
        project_cleanup_completed:
          projectDeleted,
        project_cleanup_error:
          projectCleanupError,
      })
      .eq(
        "id",
        exportHistoryId,
      )
      .eq(
        "etsy_user_id",
        etsyUserId,
      );
  
    if (historyUpdateError) {
      console.error(
        "Etsy export history cleanup status update failed:",
        historyUpdateError,
      );
    }
    
    const response =
      NextResponse.json({
        success: true,
        projectId,
        exportHistoryId,
        projectDeleted,
        projectCleanupError,
        deletedStorageFileCount,
        shopId:
          shop.shopId,
        shopName:
          shop.shopName,
        listingId:
          createdListingId,
        listingUrl:
          draft.url ?? null,
        uploadedImageCount:
          generatedImages.length,
        state:
          draft.state ?? "draft",
        message: projectDeleted
          ? "The Etsy draft was created successfully."
          : "The Etsy draft was created successfully, but the SellerOS project could not be deleted automatically.",
      });
  
    return applyEtsyAuthCookies(
      response,
      authSession,
    );
  } catch (error) {
      if (
        error instanceof
        SubscriptionAccessError
      ) {
        return NextResponse.json(
          {
            success: false,
            code: error.code,
            error: error.message,
          },
          {
            status: error.status,
          },
        );
      }
    
      console.error(
        "Etsy listing export failed:",
        {
          projectId,
          createdListingId,
          error,
        },
      );

      let partialDraftDeleted =
        false;

      let partialDraftDeleteError:
        unknown = null;

      /*
       * When Etsy created the draft but a later step failed,
       * remove the incomplete Etsy draft before allowing a retry.
       */
      if (
        createdListingId &&
        etsyRepository
      ) {
        try {
          await etsyRepository.deleteListing(
            createdListingId,
          );

          partialDraftDeleted =
            true;
        } catch (deleteError) {
          partialDraftDeleteError =
            deleteError;

          console.error(
            "Incomplete Etsy draft cleanup failed:",
            {
              listingId:
                createdListingId,
              deleteError,
            },
          );
        }
      }

      if (
        projectId &&
        isValidUuid(projectId)
      ) {
        const updateData: {
          status: string;
          etsy_listing_id?: number | null;
          etsy_listing_url?: string | null;
        } = {
          status: "failed",
        };

        if (
          createdListingId &&
          partialDraftDeleted
        ) {
          /*
           * The incomplete Etsy draft no longer exists,
           * so clear its ID and permit a safe retry.
           */
          updateData.etsy_listing_id =
            null;

          updateData.etsy_listing_url =
            null;
        } else if (
          createdListingId
        ) {
          /*
           * Preserve the Etsy ID when cleanup fails.
           * Duplicate-export protection will block another draft.
           */
          updateData.etsy_listing_id =
            createdListingId;
        }

        const {
          error: failureSaveError,
        } = await supabaseAdmin
          .from("listing_projects")
          .update(updateData)
          .eq(
            "id",
            projectId,
          );

        if (failureSaveError) {
          console.error(
            "Etsy export failure state could not be saved:",
            failureSaveError,
          );
        }
      }

      let response =
        createErrorResponse(error);

      if (
        createdListingId &&
        partialDraftDeleted
      ) {
        const originalMessage =
          error instanceof Error
            ? error.message
            : "The Etsy export failed.";

        response =
          NextResponse.json(
            {
              success: false,
              error:
                `${originalMessage} The incomplete Etsy draft was removed, and this project can be retried.`,
              partialDraftDeleted: true,
              deletedEtsyListingId:
                createdListingId,
            },
            {
              status:
                error instanceof EtsyApiError
                  ? error.status
                  : 500,
            },
          );
      } else if (
        createdListingId &&
        partialDraftDeleteError
      ) {
        const originalMessage =
          error instanceof Error
            ? error.message
            : "The Etsy export failed.";

        response =
          NextResponse.json(
            {
              success: false,
              error:
                `${originalMessage} Etsy draft ${createdListingId} may still exist because automatic cleanup failed. Do not retry this project until that draft is removed.`,
              partialDraftDeleted:
                false,
              etsyListingId:
                createdListingId,
            },
            {
              status: 500,
            },
          );
      }

      return authSession
        ? applyEtsyAuthCookies(
            response,
            authSession,
          )
        : response;
    }
}