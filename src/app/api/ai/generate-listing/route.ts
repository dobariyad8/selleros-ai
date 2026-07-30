import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  generateListingPackage,
  type GenerateListingPackageInput,
} from "@/lib/ai/generateListingPackage";
import {
  createListingProject,
  updateGeneratedListing,
} from "@/lib/listing-projects/listingProjects";

type GenerateListingRequest = {
  projectId?: unknown;
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

function readOptionalText(
  value: unknown,
) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function validateRequest(
  body: GenerateListingRequest,
): GenerateListingPackageInput {
  const productName =
    readOptionalText(body.productName);

  const productDescription =
    readOptionalText(
      body.productDescription,
    );

  if (!productName) {
    throw new Error(
      "A product name is required.",
    );
  }

  if (!productDescription) {
    throw new Error(
      "A product description is required.",
    );
  }

  if (productName.length > 140) {
    throw new Error(
      "The product name must be 140 characters or fewer.",
    );
  }

  if (
    productDescription.length > 2000
  ) {
    throw new Error(
      "The product description must be 2,000 characters or fewer.",
    );
  }

  return {
    productName,
    productDescription,
    productType:
      readOptionalText(body.productType),
    materials:
      readOptionalText(body.materials),
    primaryColor:
      readOptionalText(body.primaryColor),
    secondaryColor:
      readOptionalText(
        body.secondaryColor,
      ),
    dimensions:
      readOptionalText(body.dimensions),
    price:
      readOptionalText(body.price),
    quantity:
      readOptionalText(body.quantity),
    occasion:
      readOptionalText(body.occasion),
    personalization:
      readOptionalText(
        body.personalization,
      ),
    productionTime:
      readOptionalText(
        body.productionTime,
      ),
  };
}

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

export async function POST(
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
            "Connect your Etsy shop before generating a listing.",
        },
        {
          status: 401,
        },
      );
    }

    const body =
      (await request.json()) as GenerateListingRequest;

    const input = validateRequest(body);

    const requestedProjectId =
      readOptionalText(body.projectId);

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

    let projectId =
      requestedProjectId;

    if (!projectId) {
      const project =
        await createListingProject({
          etsyUserId,
          productName:
            input.productName,
          productDescription:
            input.productDescription,
          productType:
            input.productType,
          sourceMaterials:
            input.materials,
          primaryColor:
            input.primaryColor,
          secondaryColor:
            input.secondaryColor,
          dimensions:
            input.dimensions,
          price:
            input.price,
          quantity:
            input.quantity,
          occasion:
            input.occasion,
          personalization:
            input.personalization,
          productionTime:
            input.productionTime,
        });

      projectId = project.id;
    }

    const listingPackage =
      await generateListingPackage(input);

    const savedProject =
      await updateGeneratedListing({
        projectId,
        etsyUserId,
        generatedTitle:
          listingPackage.title,
        generatedDescription:
          listingPackage.description,
        generatedTags:
          listingPackage.tags,
        generatedMaterials:
          listingPackage.materials,
        generatedHighlights:
          listingPackage.highlights,
        imagePlan:
          listingPackage.imagePlan,
        status: "ready",
      });

    return NextResponse.json({
      success: true,
      projectId: savedProject.id,
      projectStatus:
        savedProject.status,
      listingPackage,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The Etsy listing could not be generated.";

    console.error(
      "Etsy listing generation failed:",
      error,
    );

    const status =
      message.includes("required") ||
      message.includes("characters") ||
      message.includes("Price") ||
      message.includes("Quantity") ||
      message.includes("project ID")
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