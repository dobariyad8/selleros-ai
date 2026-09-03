import { publicEnv } from "@/lib/env/public";
import { serverEnv } from "@/lib/env/server";

export const dynamic = "force-dynamic";

const responseHeaders = {
  "Cache-Control":
    "no-store, no-cache, must-revalidate",
};

export function GET() {
  const timestamp = new Date().toISOString();

  try {
    void serverEnv.appUrl;

    void serverEnv.etsyApiKey;
    void serverEnv.etsySharedSecret;
    void serverEnv.etsyRedirectUri;

    void serverEnv.openAiApiKey;

    void serverEnv.supabaseUrl;
    void serverEnv.supabaseSecretKey;

    void publicEnv.supabaseUrl;
    void publicEnv.supabasePublishableKey;

    void serverEnv.cronSecret;

    void serverEnv.stripeSecretKey;
    void serverEnv.stripeProPriceId;
    void serverEnv.stripeWebhookSecret;

    return Response.json(
      {
        status: "ok",
        service: "SellerOS AI",
        configuration: {
          application: "configured",
          etsy: "configured",
          openai: "configured",
          supabase: "configured",
          cron: "configured",
          stripe: "configured",
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
          "Required application configuration is missing.",
        timestamp,
      },
      {
        status: 503,
        headers: responseHeaders,
      },
    );
  }
}