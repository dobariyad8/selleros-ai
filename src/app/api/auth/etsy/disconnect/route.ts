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

export function POST(request: NextRequest) {
  const response = NextResponse.redirect(
    new URL(
      "/settings?etsy=disconnected",
      request.url,
    ),
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