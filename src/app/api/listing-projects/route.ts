import {
  NextRequest,
  NextResponse,
} from "next/server";

import { supabaseAdmin } from "@/lib/supabase/server";
import { saveListingProjectChanges } from "@/lib/listing-projects/listingProjects";

function getEtsyUserId(
  request: NextRequest,
) {
  const accessToken =
    request.cookies.get(
      "etsy_access_token",
    )?.value;

  if (!accessToken) {
    return null;
  }

  const userId =
    accessToken.split(".")[0]?.trim();

  return userId || null;
}

function isValidUuid(
  value: string,
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

const projectSelect = `
  id,
  status,
  product_name,
  product_description,
  product_type,
  source_materials,
  primary_color,
  secondary_color,
  dimensions,
  price,
  quantity,
  occasion,
  personalization,
  production_time,
  generated_title,
  generated_description,
  generated_tags,
  generated_materials,
  generated_highlights,
  image_plan,
  etsy_listing_id,
  etsy_listing_url,
  created_at,
  updated_at,
  expires_at
`;

type SaveListingProjectRequest = {
  projectId?: unknown;

  formData?: {
    productName?: unknown;
    productDescription?: unknown;
    productType?: unknown;
    materials?: unknown;
    primaryColor?: unknown;
    secondaryColor?: unknown;
    dimensions?: unknown;
    price?: unknown;
    quantity?: unknown;
    occasion?: unknown;
    personalization?: unknown;
    productionTime?: unknown;
  };

  listingPackage?: {
    title?: unknown;
    description?: unknown;
    tags?: unknown;
    materials?: unknown;
    highlights?: unknown;
    imagePlan?: unknown;
  };
};

function readText(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function readStringArray(
  value: unknown,
  fieldName: string,
) {
  if (
    !Array.isArray(value) ||
    !value.every(
      (item) =>
        typeof item === "string",
    )
  ) {
    throw new Error(
      `${fieldName} must be a list of text values.`,
    );
  }

  return value;
}

export async function GET(
  request: NextRequest,
) {
  try {
    const etsyUserId =
      getEtsyUserId(request);

    if (!etsyUserId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Connect your Etsy shop before loading listing projects.",
        },
        {
          status: 401,
        },
      );
    }

    const requestedProjectId =
      request.nextUrl.searchParams
        .get("projectId")
        ?.trim() ?? "";

    if (
      requestedProjectId &&
      !isValidUuid(requestedProjectId)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The listing project ID is invalid.",
        },
        {
          status: 400,
        },
      );
    }

    if (requestedProjectId) {
      const {
        data: project,
        error: projectError,
      } = await supabaseAdmin
        .from("listing_projects")
        .select(projectSelect)
        .eq(
          "id",
          requestedProjectId,
        )
        .eq(
          "etsy_user_id",
          etsyUserId,
        )
        .maybeSingle();

      if (projectError) {
        console.error(
          "Listing project load failed:",
          projectError,
        );

        throw new Error(
          "The listing project could not be loaded.",
        );
      }

      if (!project) {
        return NextResponse.json(
          {
            success: false,
            error:
              "The listing project was not found.",
          },
          {
            status: 404,
          },
        );
      }

      const {
        data: imageRecords,
        error: imagesError,
      } = await supabaseAdmin
        .from(
          "listing_project_images",
        )
        .select(
          `
            image_kind,
            generation_status
          `,
        )
        .eq(
          "project_id",
          requestedProjectId,
        )
        .eq(
          "etsy_user_id",
          etsyUserId,
        );

      if (imagesError) {
        console.error(
          "Listing project image counts failed:",
          imagesError,
        );

        throw new Error(
          "The listing project images could not be loaded.",
        );
      }

      const sourceImageCount =
        (imageRecords ?? []).filter(
          (image) =>
            image.image_kind ===
              "source" &&
            image.generation_status ===
              "complete",
        ).length;

      const generatedImageCount =
        (imageRecords ?? []).filter(
          (image) =>
            image.image_kind !==
              "source" &&
            image.generation_status ===
              "complete",
        ).length;

      return NextResponse.json({
        success: true,
        project: {
          id: project.id,
          status: project.status,

          formData: {
            productName:
              project.product_name ??
              "",
            productDescription:
              project.product_description ??
              "",
            productType:
              project.product_type ??
              "",
            materials:
              project.source_materials ??
              "",
            primaryColor:
              project.primary_color ??
              "",
            secondaryColor:
              project.secondary_color ??
              "",
            dimensions:
              project.dimensions ??
              "",
            price:
              project.price === null
                ? ""
                : String(project.price),
            quantity:
              project.quantity === null
                ? "1"
                : String(
                    project.quantity,
                  ),
            occasion:
              project.occasion ?? "",
            personalization:
              project.personalization ??
              "no",
            productionTime:
              project.production_time ??
              "",
          },

          listingPackage:
            project.generated_title &&
            project.generated_description
              ? {
                  title:
                    project.generated_title,
                  description:
                    project.generated_description,
                  tags:
                    project.generated_tags ??
                    [],
                  materials:
                    project.generated_materials ??
                    [],
                  highlights:
                    project.generated_highlights ??
                    [],
                  imagePlan:
                    project.image_plan ??
                    [],
                }
              : null,

          sourceImageCount,
          generatedImageCount,

          etsyListingId:
            project.etsy_listing_id,
          etsyListingUrl:
            project.etsy_listing_url,

          createdAt:
            project.created_at,
          updatedAt:
            project.updated_at,
          expiresAt:
            project.expires_at,
        },
      });
    }

    const {
      data: projects,
      error: projectsError,
    } = await supabaseAdmin
      .from("listing_projects")
      .select(projectSelect)
      .eq(
        "etsy_user_id",
        etsyUserId,
      )
      .order("updated_at", {
        ascending: false,
      });

    if (projectsError) {
      console.error(
        "Listing projects load failed:",
        projectsError,
      );

      throw new Error(
        "The listing projects could not be loaded.",
      );
    }

    const projectIds =
      (projects ?? []).map(
        (project) => project.id,
      );

    let imageRecords: {
      project_id: string;
      image_kind: string;
      image_rank: number;
      storage_path: string | null;
      generation_status: string;
    }[] = [];

    if (projectIds.length > 0) {
      const {
        data,
        error: imagesError,
      } = await supabaseAdmin
        .from(
          "listing_project_images",
        )
        .select(
          `
            project_id,
            image_kind,
            image_rank,
            storage_path,
            generation_status
          `,
        )
        .eq(
          "etsy_user_id",
          etsyUserId,
        )
        .in(
          "project_id",
          projectIds,
        );

      if (imagesError) {
        console.error(
          "Listing project image counts failed:",
          imagesError,
        );

        throw new Error(
          "The listing project images could not be loaded.",
        );
      }

      imageRecords = data ?? [];
    }

    const results =
      (projects ?? []).map(
        (project) => {
          const projectImages =
            imageRecords.filter(
              (image) =>
                image.project_id ===
                project.id,
            );

          const sourceImageCount =
            projectImages.filter(
              (image) =>
                image.image_kind ===
                  "source" &&
                image.generation_status ===
                  "complete",
            ).length;

          const generatedImageCount =
            projectImages.filter(
              (image) =>
                image.image_kind !==
                  "source" &&
                image.generation_status ===
                  "complete",
            ).length;

          return {
            id: project.id,
            status: project.status,
            productName:
              project.product_name,
            productType:
              project.product_type,
            price: project.price,
            quantity:
              project.quantity,
            generatedTitle:
              project.generated_title,
            generatedDescription:
              project.generated_description,
            generatedTags:
              project.generated_tags ??
              [],
            generatedMaterials:
              project.generated_materials ??
              [],
            generatedHighlights:
              project.generated_highlights ??
              [],
            imagePlan:
              project.image_plan ?? [],
            sourceImageCount,
            generatedImageCount,
            etsyListingId:
              project.etsy_listing_id,
            etsyListingUrl:
              project.etsy_listing_url,
            createdAt:
              project.created_at,
            updatedAt:
              project.updated_at,
            expiresAt:
              project.expires_at,
          };
        },
      );

    return NextResponse.json({
      success: true,
      projects: results,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The listing projects could not be loaded.";

    console.error(
      "Listing projects retrieval failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(
  request: NextRequest,
) {
  try {
    const etsyUserId =
      getEtsyUserId(request);

    if (!etsyUserId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Connect your Etsy shop before saving listing changes.",
        },
        {
          status: 401,
        },
      );
    }

    const body =
      (await request.json()) as SaveListingProjectRequest;

    const projectId =
      readText(body.projectId);

    if (
      !projectId ||
      !isValidUuid(projectId)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A valid listing project ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !body.formData ||
      typeof body.formData !==
        "object"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Listing form data is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !body.listingPackage ||
      typeof body.listingPackage !==
        "object"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The generated listing package is required.",
        },
        {
          status: 400,
        },
      );
    }

    const imagePlanValue =
      body.listingPackage.imagePlan;

    if (
      !Array.isArray(
        imagePlanValue,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The image plan is invalid.",
        },
        {
          status: 400,
        },
      );
    }

    const imagePlan =
      imagePlanValue.map(
        (item, index) => {
          if (
            !item ||
            typeof item !==
              "object"
          ) {
            throw new Error(
              `Image plan item ${
                index + 1
              } is invalid.`,
            );
          }

          const record =
            item as Record<
              string,
              unknown
            >;

          const id =
            readText(record.id);

          const type =
            readText(record.type);

          const allowedTypes = [
            "studio",
            "lifestyle",
            "detail",
            "scale",
            "gift",
            "seasonal",
          ] as const;

          if (
            !id ||
            !allowedTypes.includes(
              type as
                (typeof allowedTypes)[number],
            )
          ) {
            throw new Error(
              `Image plan item ${
                index + 1
              } is invalid.`,
            );
          }

          return {
            id,
            type:
              type as
                (typeof allowedTypes)[number],
            title:
              readText(record.title),
            description:
              readText(
                record.description,
              ),
            generationInstructions:
              readText(
                record.generationInstructions,
              ),
          };
        },
      );

    const savedProject =
      await saveListingProjectChanges({
        projectId,
        etsyUserId,

        productName:
          readText(
            body.formData.productName,
          ),
        productDescription:
          readText(
            body.formData
              .productDescription,
          ),
        productType:
          readText(
            body.formData.productType,
          ),
        sourceMaterials:
          readText(
            body.formData.materials,
          ),
        primaryColor:
          readText(
            body.formData.primaryColor,
          ),
        secondaryColor:
          readText(
            body.formData.secondaryColor,
          ),
        dimensions:
          readText(
            body.formData.dimensions,
          ),
        price:
          readText(
            body.formData.price,
          ),
        quantity:
          readText(
            body.formData.quantity,
          ),
        occasion:
          readText(
            body.formData.occasion,
          ),
        personalization:
          readText(
            body.formData
              .personalization,
          ),
        productionTime:
          readText(
            body.formData
              .productionTime,
          ),

        generatedTitle:
          readText(
            body.listingPackage.title,
          ),
        generatedDescription:
          readText(
            body.listingPackage
              .description,
          ),
        generatedTags:
          readStringArray(
            body.listingPackage.tags,
            "Tags",
          ),
        generatedMaterials:
          readStringArray(
            body.listingPackage.materials,
            "Materials",
          ),
        generatedHighlights:
          readStringArray(
            body.listingPackage.highlights,
            "Highlights",
          ),
        imagePlan,
      });

    return NextResponse.json({
      success: true,
      projectId:
        savedProject.id,
      status:
        savedProject.status,
      updatedAt:
        savedProject.updated_at,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The listing project changes could not be saved.";

    console.error(
      "Listing project save failed:",
      error,
    );

    const status =
      message.includes("required") ||
      message.includes("invalid") ||
      message.includes("must be") ||
      message.includes("Exactly")
        ? 400
        : 500;

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status,
      },
    );
  }
}