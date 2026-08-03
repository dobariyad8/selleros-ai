import { createServerClient } from "@supabase/ssr";
import {
  NextResponse,
  type NextRequest,
} from "next/server";

import { publicEnv } from "@/lib/env/public";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    publicEnv.supabaseUrl,
    publicEnv.supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(
            ({ name, value, options }) => {
              response.cookies.set(
                name,
                value,
                options,
              );
            },
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isLoginRoute = pathname === "/login";
  const isApiRoute = pathname.startsWith("/api");

  /*
   * API routes remain available for now so existing
   * Etsy OAuth callbacks and cron jobs are not broken.
   * We will secure user-facing API routes separately.
   */
  if (isApiRoute) {
    return response;
  }

  /*
   * Redirect logged-out visitors to the login page.
   */
  if (!user && !isLoginRoute) {
    const redirectUrl =
      request.nextUrl.clone();

    redirectUrl.pathname = "/login";
    redirectUrl.search = "";

    const redirectResponse =
      NextResponse.redirect(redirectUrl);

    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });

    return redirectResponse;
  }

  /*
   * Redirect authenticated users away from login.
   */
  if (user && isLoginRoute) {
    const redirectUrl =
      request.nextUrl.clone();

    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";

    const redirectResponse =
      NextResponse.redirect(redirectUrl);

    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });

    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};