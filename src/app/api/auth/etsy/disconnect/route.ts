import {
  NextRequest,
  NextResponse,
} from "next/server";

import { serverEnv } from "@/lib/env/server";

const etsyCookieNames = [
  "etsy_access_token",
  "etsy_refresh_token",
  "etsy_oauth_state",
  "etsy_code_verifier",
] as const;

function getPublicOrigin(request: NextRequest) {
  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();

  const forwardedProtocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();

  if (forwardedHost) {
    return `${
      forwardedProtocol ?? "https"
    }://${forwardedHost}`;
  }

  const host = request.headers
    .get("host")
    ?.split(",")[0]
    ?.trim();

  if (
    host &&
    !host.startsWith("0.0.0.0")
  ) {
    const protocol =
      host.includes("localhost") ||
      host.startsWith("127.0.0.1")
        ? "http"
        : "https";

    return `${protocol}://${host}`;
  }

  return request.nextUrl.origin.replace(
    "://0.0.0.0",
    "://localhost",
  );
}

export function POST(request: NextRequest) {
  const redirectUrl = new URL(
    "/settings",
    getPublicOrigin(request),
  );

  redirectUrl.searchParams.set(
    "etsy",
    "disconnected",
  );

  const response = NextResponse.redirect(
    redirectUrl,
    303,
  );

  for (const cookieName of etsyCookieNames) {
    response.cookies.set(cookieName, "", {
      httpOnly: true,
      secure: serverEnv.isProduction,
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
      maxAge: 0,
    });
  }

  return response;
}