import "server-only";

import type {
  NextRequest,
  NextResponse,
} from "next/server";

import { serverEnv } from "@/lib/env/server";

const ETSY_TOKEN_URL =
  "https://api.etsy.com/v3/public/oauth/token";

type EtsyTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  error?: string;
  error_description?: string;
};

export type EtsyAuthSession = {
  accessToken: string;
  refreshToken: string | null;
  userId: string;
  wasRefreshed: boolean;
  expiresIn: number | null;
};

function getEtsyUserId(
  token: string,
) {
  const userId =
    token.split(".")[0]?.trim();

  if (!userId) {
    throw new Error(
      "Could not determine the Etsy user ID.",
    );
  }

  return userId;
}

async function refreshEtsyToken(
  refreshToken: string,
) {
  const requestBody =
    new URLSearchParams({
      grant_type: "refresh_token",
      client_id:
        serverEnv.etsyApiKey,
      refresh_token:
        refreshToken,
    });

  const response = await fetch(
    ETSY_TOKEN_URL,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body: requestBody,
      cache: "no-store",
    },
  );

  const data =
    (await response.json()) as EtsyTokenResponse;

  if (
    !response.ok ||
    !data.access_token
  ) {
    console.error(
      "Etsy token refresh failed:",
      {
        status: response.status,
        error: data.error,
        description:
          data.error_description,
      },
    );

    throw new Error(
      data.error_description ||
        data.error ||
        "Your Etsy connection has expired. Reconnect your Etsy shop.",
    );
  }

  return {
    accessToken:
      data.access_token,
    refreshToken:
      data.refresh_token ??
      refreshToken,
    expiresIn:
      data.expires_in ?? 3600,
  };
}

export async function getEtsyAuthSession(
  request: NextRequest,
): Promise<EtsyAuthSession> {
  const accessToken =
    request.cookies.get(
      "etsy_access_token",
    )?.value;

  const refreshToken =
    request.cookies.get(
      "etsy_refresh_token",
    )?.value;

  if (accessToken) {
    return {
      accessToken,
      refreshToken:
        refreshToken ?? null,
      userId:
        getEtsyUserId(
          accessToken,
        ),
      wasRefreshed: false,
      expiresIn: null,
    };
  }

  if (!refreshToken) {
    throw new Error(
      "Connect your Etsy shop before continuing.",
    );
  }

  const refreshed =
    await refreshEtsyToken(
      refreshToken,
    );

  return {
    accessToken:
      refreshed.accessToken,
    refreshToken:
      refreshed.refreshToken,
    userId:
      getEtsyUserId(
        refreshed.accessToken,
      ),
    wasRefreshed: true,
    expiresIn:
      refreshed.expiresIn,
  };
}

export function getEtsyApiHeaders(
  accessToken: string,
) {
  return {
    "x-api-key":
      `${serverEnv.etsyApiKey}:${serverEnv.etsySharedSecret}`,
    Authorization:
      `Bearer ${accessToken}`,
  };
}

export function applyEtsyAuthCookies(
  response: NextResponse,
  session: EtsyAuthSession,
) {
  if (!session.wasRefreshed) {
    return response;
  }

  response.cookies.set(
    "etsy_access_token",
    session.accessToken,
    {
      httpOnly: true,
      sameSite: "lax",
      secure:
        serverEnv.isProduction,
      maxAge:
        session.expiresIn ??
        3600,
      path: "/",
    },
  );

  if (session.refreshToken) {
    response.cookies.set(
      "etsy_refresh_token",
      session.refreshToken,
      {
        httpOnly: true,
        sameSite: "lax",
        secure:
          serverEnv.isProduction,
        maxAge:
          60 * 60 * 24 * 90,
        path: "/",
      },
    );
  }

  return response;
}