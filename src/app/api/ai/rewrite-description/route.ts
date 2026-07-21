import { NextResponse } from "next/server";

import { rewriteDescription } from "@/lib/ai/rewriteDescription";

type RewriteDescriptionRequest = {
  title?: unknown;
  description?: unknown;
};

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as RewriteDescriptionRequest;

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
      typeof body.description !== "string" ||
      !body.description.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A current listing description is required.",
        },
        {
          status: 400,
        },
      );
    }

    const suggestedDescription =
      await rewriteDescription(
        body.title,
        body.description,
      );

    return NextResponse.json({
      success: true,
      suggestedDescription,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The description could not be rewritten.";

    console.error(
      "Description rewrite failed:",
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