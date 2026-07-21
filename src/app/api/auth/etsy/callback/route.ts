import { NextRequest, NextResponse } from "next/server";

type EtsyTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  error?: string;
  error_description?: string;
};

export async function GET(request: NextRequest) {
  const clientId = process.env.ETSY_API_KEY;
  const redirectUri = process.env.ETSY_REDIRECT_URI;

  const authorizationCode = request.nextUrl.searchParams.get("code");
  const returnedState = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");

  const savedState = request.cookies.get("etsy_oauth_state")?.value;
  const codeVerifier = request.cookies.get("etsy_code_verifier")?.value;

  if (oauthError) {
    return NextResponse.json(
      {
        success: false,
        error: oauthError,
      },
      { status: 400 }
    );
  }

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing Etsy environment variables.",
      },
      { status: 500 }
    );
  }

  if (!authorizationCode) {
    return NextResponse.json(
      {
        success: false,
        error: "Authorization code was not returned by Etsy.",
      },
      { status: 400 }
    );
  }

  if (!savedState || !returnedState || savedState !== returnedState) {
    return NextResponse.json(
      {
        success: false,
        error: "OAuth state validation failed.",
      },
      { status: 400 }
    );
  }

  if (!codeVerifier) {
    return NextResponse.json(
      {
        success: false,
        error: "PKCE code verifier is missing.",
      },
      { status: 400 }
    );
  }

  try {
    const tokenResponse = await fetch(
      "https://openapi.etsy.com/v3/public/oauth/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grant_type: "authorization_code",
          client_id: clientId,
          redirect_uri: redirectUri,
          code: authorizationCode,
          code_verifier: codeVerifier,
        }),
        cache: "no-store",
      }
    );

    const tokenData = (await tokenResponse.json()) as EtsyTokenResponse;

    if (!tokenResponse.ok || !tokenData.access_token) {
      return NextResponse.json(
        {
          success: false,
          status: tokenResponse.status,
          error: tokenData.error ?? "Token exchange failed.",
          description: tokenData.error_description,
        },
        { status: tokenResponse.status }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Etsy shop connected successfully.",
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type,
      hasAccessToken: true,
      hasRefreshToken: Boolean(tokenData.refresh_token),
    });

    response.cookies.set("etsy_access_token", tokenData.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: tokenData.expires_in ?? 3600,
      path: "/",
    });

    if (tokenData.refresh_token) {
      response.cookies.set("etsy_refresh_token", tokenData.refresh_token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 90,
        path: "/",
      });
    }

    response.cookies.delete("etsy_oauth_state");
    response.cookies.delete("etsy_code_verifier");

    return response;
  } catch (error) {
    console.error("Etsy OAuth callback failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Could not exchange the Etsy authorization code.",
      },
      { status: 500 }
    );
  }
}