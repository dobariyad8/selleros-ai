import { NextResponse } from "next/server";

import { optimizeListing } from "@/lib/ai/optimizeListing";

type OptimizeListingRequest = {
  title?: unknown;
  description?: unknown;
  tags?: unknown;
};

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as OptimizeListingRequest;

    if (
      typeof body.title !== "string" ||
      !body.title.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "A listing title is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      body.description !== undefined &&
      typeof body.description !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The listing description must be text.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      body.tags !== undefined &&
      !Array.isArray(body.tags)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Listing tags must be provided as an array.",
        },
        {
          status: 400,
        },
      );
    }

    const tags = Array.isArray(body.tags)
      ? body.tags.filter(
          (tag): tag is string =>
            typeof tag === "string",
        )
      : [];

    const optimizedListing =
      await optimizeListing({
        title: body.title,
        description:
          typeof body.description === "string"
            ? body.description
            : "",
        tags,
      });

    return NextResponse.json({
      success: true,
      optimizedListing,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The listing could not be optimized.";

    console.error(
      "Complete listing optimization failed:",
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