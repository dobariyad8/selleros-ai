import {
  NextRequest,
  NextResponse,
} from "next/server";

import { getImageUsage } from "@/lib/ai/imageUsage";

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
            "Connect your Etsy shop to view image credits.",
        },
        {
          status: 401,
        },
      );
    }

    const usage =
      await getImageUsage(etsyUserId);

    return NextResponse.json({
      success: true,
      usage: {
        used: usage.used,
        limit: usage.limit,
        remaining:
          usage.remaining,
        billingMonth:
          usage.billingMonth,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Image-generation credits could not be loaded.";

    console.error(
      "Image usage request failed:",
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