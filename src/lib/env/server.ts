import "server-only";

type RequiredEnvironmentVariable =
  | "ETSY_API_KEY"
  | "ETSY_SHARED_SECRET"
  | "ETSY_REDIRECT_URI"
  | "OPENAI_API_KEY"
  | "SUPABASE_URL"
  | "SUPABASE_SECRET_KEY"
  | "CRON_SECRET"
  | "STRIPE_SECRET_KEY"
  | "STRIPE_PRO_PRICE_ID"
  | "STRIPE_WEBHOOK_SECRET";

function getRequiredEnvironmentVariable(
  name: RequiredEnvironmentVariable,
) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`,
    );
  }

  return value;
}

export const serverEnv = {
  get etsyApiKey() {
    return getRequiredEnvironmentVariable(
      "ETSY_API_KEY",
    );
  },

  get etsySharedSecret() {
    return getRequiredEnvironmentVariable(
      "ETSY_SHARED_SECRET",
    );
  },

  get etsyRedirectUri() {
    return getRequiredEnvironmentVariable(
      "ETSY_REDIRECT_URI",
    );
  },

  get openAiApiKey() {
    return getRequiredEnvironmentVariable(
      "OPENAI_API_KEY",
    );
  },

  get supabaseUrl() {
    return getRequiredEnvironmentVariable(
      "SUPABASE_URL",
    );
  },

  get supabaseSecretKey() {
    return getRequiredEnvironmentVariable(
      "SUPABASE_SECRET_KEY",
    );
  },

  get cronSecret() {
    return getRequiredEnvironmentVariable(
      "CRON_SECRET",
    );
  },

  get stripeSecretKey() {
    return getRequiredEnvironmentVariable(
      "STRIPE_SECRET_KEY",
    );
  },

  get stripeProPriceId() {
    return getRequiredEnvironmentVariable(
      "STRIPE_PRO_PRICE_ID",
    );
  },

  get stripeWebhookSecret() {
    return getRequiredEnvironmentVariable(
      "STRIPE_WEBHOOK_SECRET",
    );
  },

  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
};