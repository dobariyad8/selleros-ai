import {
  NextRequest,
  NextResponse,
} from "next/server";

import { serverEnv } from "@/lib/env/server";
import { createSupabaseServerClient } from "@/lib/supabase/auth-server";
import { supabaseAdmin } from "@/lib/supabase/server";

const ETSY_TOKEN_URL =
  "https://openapi.etsy.com/v3/public/oauth/token";

const ETSY_SCOPES = [
  "shops_r",
  "listings_r",
  "listings_w",
  "listings_d",
  "transactions_r",
];

type EtsyTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  error?: string;
  error_description?: string;
};

function getEtsyUserId(
  accessToken: string,
) {
  const userId = accessToken
    .split(".")[0]
    ?.trim();

  if (!userId) {
    throw new Error(
      "Could not determine the Etsy user ID from the access token.",
    );
  }

  return userId;
}

export async function GET(
  request: NextRequest,
) {
  const supabase =
    await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl =
      request.nextUrl.clone();

    loginUrl.pathname = "/login";
    loginUrl.search = "";

    return NextResponse.redirect(loginUrl);
  }

  const clientId = serverEnv.etsyApiKey;
  const redirectUri =
    serverEnv.etsyRedirectUri;

  const authorizationCode =
    request.nextUrl.searchParams.get(
      "code",
    );

  const returnedState =
    request.nextUrl.searchParams.get(
      "state",
    );

  const oauthError =
    request.nextUrl.searchParams.get(
      "error",
    );

  const savedState =
    request.cookies.get(
      "etsy_oauth_state",
    )?.value;

  const codeVerifier =
    request.cookies.get(
      "etsy_code_verifier",
    )?.value;

  if (oauthError) {
    return NextResponse.json(
      {
        success: false,
        error: oauthError,
      },
      {
        status: 400,
      },
    );
  }

  if (!authorizationCode) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Authorization code was not returned by Etsy.",
      },
      {
        status: 400,
      },
    );
  }

  if (
    !savedState ||
    !returnedState ||
    savedState !== returnedState
  ) {
    return NextResponse.json(
      {
        success: false,
        error:
          "OAuth state validation failed.",
      },
      {
        status: 400,
      },
    );
  }

  if (!codeVerifier) {
    return NextResponse.json(
      {
        success: false,
        error:
          "PKCE code verifier is missing.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const tokenResponse = await fetch(
      ETSY_TOKEN_URL,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          grant_type:
            "authorization_code",
          client_id: clientId,
          redirect_uri: redirectUri,
          code: authorizationCode,
          code_verifier: codeVerifier,
        }),
        cache: "no-store",
      },
    );

    const tokenData =
      (await tokenResponse.json()) as EtsyTokenResponse;

    if (
      !tokenResponse.ok ||
      !tokenData.access_token
    ) {
      return NextResponse.json(
        {
          success: false,
          status: tokenResponse.status,
          error:
            tokenData.error ??
            "Token exchange failed.",
          description:
            tokenData.error_description,
        },
        {
          status: tokenResponse.status,
        },
      );
    }

    if (!tokenData.refresh_token) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Etsy did not return a refresh token. Reconnect your Etsy shop.",
        },
        {
          status: 500,
        },
      );
    }

    const etsyUserId =
      getEtsyUserId(
        tokenData.access_token,
      );

    const expiresIn =
      tokenData.expires_in ?? 3600;

    const accessTokenExpiresAt =
      new Date(
        Date.now() +
          expiresIn * 1000,
      ).toISOString();

    const now =
      new Date().toISOString();

    const {
      error:
        existingUserConnectionError,
    } = await supabaseAdmin
      .from("etsy_connections")
      .delete()
      .eq("user_id", user.id)
      .neq(
        "etsy_user_id",
        etsyUserId,
      );

    if (existingUserConnectionError) {
      console.error(
        "Could not remove the user's previous Etsy connection:",
        existingUserConnectionError,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "SellerOS could not replace the existing Etsy connection.",
        },
        {
          status: 500,
        },
      );
    }

    const {
      error:
        connectionSaveError,
    } = await supabaseAdmin
      .from("etsy_connections")
      .upsert(
        {
          etsy_user_id:
            etsyUserId,
          user_id: user.id,
          access_token:
            tokenData.access_token,
          refresh_token:
            tokenData.refresh_token,
          access_token_expires_at:
            accessTokenExpiresAt,
          scopes: ETSY_SCOPES,
          connection_status:
            "active",
          last_refreshed_at: now,
          last_error: null,
          updated_at: now,
        },
        {
          onConflict:
            "etsy_user_id",
        },
      );

    if (connectionSaveError) {
      console.error(
        "Persistent Etsy connection save failed:",
        connectionSaveError,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Your Etsy authorization succeeded, but SellerOS could not save the persistent connection.",
        },
        {
          status: 500,
        },
      );
    }

    const response =
      NextResponse.redirect(
        new URL(
          "/settings?etsy=connected",
          redirectUri,
        ),
      );

    response.cookies.set(
      "etsy_access_token",
      tokenData.access_token,
      {
        httpOnly: true,
        sameSite: "lax",
        secure:
          serverEnv.isProduction,
        maxAge: expiresIn,
        path: "/",
      },
    );

    response.cookies.set(
      "etsy_refresh_token",
      tokenData.refresh_token,
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

    response.cookies.delete(
      "etsy_oauth_state",
    );

    response.cookies.delete(
      "etsy_code_verifier",
    );

    return response;
  } catch (error) {
    console.error(
      "Etsy OAuth callback failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Could not exchange the Etsy authorization code.",
      },
      {
        status: 500,
      },
    );
  }
}