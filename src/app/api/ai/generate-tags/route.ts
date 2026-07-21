import { NextResponse } from "next/server";

import { generateTags } from "@/lib/ai/generateTags";

type GenerateTagsRequest = {
  title?: unknown;
  description?: unknown;
  currentTags?: unknown;
};

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as GenerateTagsRequest;

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
      body.currentTags !== undefined &&
      !Array.isArray(body.currentTags)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Current tags must be provided as an array.",
        },
        {
          status: 400,
        },
      );
    }

    const currentTags = Array.isArray(
      body.currentTags,
    )
      ? body.currentTags.filter(
          (tag): tag is string =>
            typeof tag === "string",
        )
      : [];

    const suggestedTags = await generateTags(
      body.title,
      typeof body.description === "string"
        ? body.description
        : "",
      currentTags,
    );

    return NextResponse.json({
      success: true,
      suggestedTags,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The tags could not be generated.";

    console.error("Tag generation failed:", error);

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