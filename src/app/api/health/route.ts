import { serverEnv } from "@/lib/env/server";

export const dynamic = "force-dynamic";

const responseHeaders = {
  "Cache-Control":
    "no-store, no-cache, must-revalidate",
};

export function GET() {
  const timestamp = new Date().toISOString();

  try {
    void serverEnv.etsyApiKey;
    void serverEnv.etsySharedSecret;
    void serverEnv.etsyRedirectUri;
    void serverEnv.openAiApiKey;

    return Response.json(
      {
        status: "ok",
        service: "SellerOS AI",
        dependencies: {
          etsy: "configured",
          openai: "configured",
        },
        timestamp,
      },
      {
        status: 200,
        headers: responseHeaders,
      },
    );
  } catch (error) {
    console.error(
      "SellerOS health check failed:",
      error,
    );

    return Response.json(
      {
        status: "error",
        service: "SellerOS AI",
        message:
          "Required server configuration is missing.",
        timestamp,
      },
      {
        status: 503,
        headers: responseHeaders,
      },
    );
  }
}