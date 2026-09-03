import { NextResponse } from "next/server";

import {
  requireProSubscription,
  SubscriptionAccessError,
} from "@/lib/billing/requireProSubscription";

import { rewriteTitle } from "@/lib/ai/rewriteTitle";

type RewriteTitleRequest = {
  title?: unknown;
};

export async function POST(request: Request) {
  try {
    await requireProSubscription();

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