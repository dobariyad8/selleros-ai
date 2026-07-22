import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/env/server";

type EtsyShop = {
  shop_id: number;
  user_id: number;
  shop_name: string;
  title?: string | null;
  announcement?: string | null;
  currency_code?: string;
  is_vacation?: boolean;
  listing_active_count?: number;
  url?: string;
  icon_url_fullxfull?: string | null;
};

export async function GET(request: NextRequest) {
  const apiKey = serverEnv.etsyApiKey;
  const sharedSecret = serverEnv.etsySharedSecret;
  const accessToken = request.cookies.get("etsy_access_token")?.value;

  if (!apiKey || !sharedSecret) {
    return NextResponse.json(
      {
        success: false,
        error: "Etsy API credentials are missing.",
      },
      { status: 500 }
    );
  }

  if (!accessToken) {
    return NextResponse.json(
      {
        success: false,
        error: "Etsy shop is not connected.",
      },
      { status: 401 }
    );
  }

  const userId = accessToken.split(".")[0];

  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        error: "Could not determine the Etsy user ID.",
      },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://openapi.etsy.com/v3/application/users/${userId}/shops`,
      {
        headers: {
          "x-api-key": `${apiKey}:${sharedSecret}`,
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    const data = (await response.json()) as EtsyShop | {
      error?: string;
    };

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          status: response.status,
          error:
            "error" in data
              ? data.error
              : "Could not retrieve the Etsy shop.",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      shop: data,
    });
  } catch (error) {
    console.error("Etsy shop request failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Could not connect to Etsy.",
      },
      { status: 500 }
    );
  }
}