import "server-only";

type RequiredEnvironmentVariable =
  | "ETSY_API_KEY"
  | "ETSY_SHARED_SECRET"
  | "ETSY_REDIRECT_URI"
  | "OPENAI_API_KEY";

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

  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
};