import { NextResponse } from "next/server";

import {
  requireProSubscription,
  SubscriptionAccessError,
} from "@/lib/billing/requireProSubscription";

import { rewriteDescription } from "@/lib/ai/rewriteDescription";

type RewriteDescriptionRequest = {
  title?: unknown;
  description?: unknown;
};

export async function POST(request: Request) {
  try {
    await requireProSubscription();

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
    if (error instanceof SubscriptionAccessError) {
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