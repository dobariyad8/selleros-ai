import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env/server";

export async function GET() {
  const apiKey = serverEnv.etsyApiKey;
  const sharedSecret = serverEnv.etsySharedSecret;

  if (!apiKey || !sharedSecret) {
    return NextResponse.json(
      {
        success: false,
        error: "Etsy API credentials are missing.",
      },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      "https://openapi.etsy.com/v3/application/openapi-ping",
      {
        headers: {
          "x-api-key": `${apiKey}:${sharedSecret}`,
        },
        cache: "no-store",
      }
    );

    const data: unknown = await response.json();

    return NextResponse.json(
      {
        success: response.ok,
        status: response.status,
        data,
      },
      { status: response.status }
    );
  } catch (error) {
    console.error("Etsy ping failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Could not connect to Etsy.",
      },
      { status: 500 }
    );
  }
}