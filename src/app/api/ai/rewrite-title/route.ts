import { NextResponse } from "next/server";

import { rewriteTitle } from "@/lib/ai/rewriteTitle";

type RewriteTitleRequest = {
  title?: unknown;
};

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as RewriteTitleRequest;

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

    const suggestedTitle = await rewriteTitle(
      body.title,
    );

    return NextResponse.json({
      success: true,
      suggestedTitle,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The title could not be rewritten.";

    console.error("Title rewrite failed:", error);

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