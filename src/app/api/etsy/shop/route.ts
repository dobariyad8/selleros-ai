import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  applyEtsyAuthCookies,
  type EtsyAuthSession,
} from "@/lib/etsy/auth";
import {
  createEtsyRepository,
} from "@/lib/etsy/createRepository";
import { serverEnv } from "@/lib/env/server";

export const runtime = "nodejs";

const ETSY_API_BASE_URL =
  "https://api.etsy.com/v3/application";

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

type EtsyShopErrorResponse = {
  error?: string;
};

export async function GET(
  request: NextRequest,
) {
  let authSession:
    | EtsyAuthSession
    | null = null;

  try {
    const {
      authSession:
        repositoryAuthSession,
    } =
      await createEtsyRepository(
        request,
      );

    authSession =
      repositoryAuthSession;

    const apiKey =
      serverEnv.etsyApiKey;

    const sharedSecret =
      serverEnv.etsySharedSecret;

    const userId =
      authSession.userId;

    const accessToken =
      authSession.accessToken;

    const response = await fetch(
      `${ETSY_API_BASE_URL}/users/${encodeURIComponent(
        userId,
      )}/shops`,
      {
        headers: {
          "x-api-key":
            `${apiKey}:${sharedSecret}`,
          Authorization:
            `Bearer ${accessToken}`,
        },
        cache: "no-store",
      },
    );

    const data =
      (await response.json()) as
        | EtsyShop
        | EtsyShopErrorResponse;

    if (!response.ok) {
      const errorMessage =
        "error" in data &&
        typeof data.error ===
          "string"
          ? data.error
          : "Could not retrieve the Etsy shop.";

      const errorResponse =
        NextResponse.json(
          {
            success: false,
            status:
              response.status,
            error:
              errorMessage,
          },
          {
            status:
              response.status,
          },
        );

      return applyEtsyAuthCookies(
        errorResponse,
        authSession,
      );
    }

    const shop =
      data as EtsyShop;

    if (!shop.shop_id) {
      const invalidShopResponse =
        NextResponse.json(
          {
            success: false,
            error:
              "Could not retrieve the connected Etsy shop.",
          },
          {
            status: 502,
          },
        );

      return applyEtsyAuthCookies(
        invalidShopResponse,
        authSession,
      );
    }

    const successResponse =
      NextResponse.json({
        success: true,
        shop,
      });

    return applyEtsyAuthCookies(
      successResponse,
      authSession,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not connect to Etsy.";

    console.error(
      "Etsy shop request failed:",
      error,
    );

    const status =
      message.includes(
        "Log in to SellerOS",
      )
        ? 401
        : message.includes(
              "Connect your Etsy shop",
            ) ||
            message.includes(
              "connection is not active",
            ) ||
            message.includes(
              "Reconnect your Etsy shop",
            )
          ? 401
          : 500;

    const response =
      NextResponse.json(
        {
          success: false,
          error: message,
        },
        {
          status,
        },
      );

    return authSession
      ? applyEtsyAuthCookies(
          response,
          authSession,
        )
      : response;
  }
}