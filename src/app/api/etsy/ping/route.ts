import {
  NextResponse,
} from "next/server";

import {
  serverEnv,
} from "@/lib/env/server";
import {
  createSupabaseServerClient,
} from "@/lib/supabase/auth-server";

export async function GET() {
  try {
    const supabase =
      await createSupabaseServerClient();

    const {
      data: {
        user,
      },
      error: authError,
    } =
      await supabase.auth.getUser();

    if (
      authError ||
      !user
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Authentication required.",
        },
        {
          status: 401,
        },
      );
    }

    const apiKey =
      serverEnv.etsyApiKey;

    const sharedSecret =
      serverEnv.etsySharedSecret;

    if (
      !apiKey ||
      !sharedSecret
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Etsy API credentials are missing.",
        },
        {
          status: 500,
        },
      );
    }

    const response =
      await fetch(
        "https://openapi.etsy.com/v3/application/openapi-ping",
        {
          headers: {
            "x-api-key":
              `${apiKey}:${sharedSecret}`,
          },
          cache: "no-store",
        },
      );

    if (!response.ok) {
      console.error(
        "Etsy ping returned an unsuccessful response:",
        response.status,
      );

      return NextResponse.json(
        {
          success: false,
          status:
            response.status,
          error:
            "Etsy API connection check failed.",
        },
        {
          status:
            response.status,
        },
      );
    }

    return NextResponse.json({
      success: true,
      status: response.status,
    });
  } catch (error) {
    console.error(
      "Etsy ping failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Could not connect to Etsy.",
      },
      {
        status: 500,
      },
    );
  }
}