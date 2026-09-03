import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

if (existsSync(".env.local")) {
  loadEnvFile(".env.local");
}

const requiredEnvironmentVariables = [
  "APP_URL",

  "ETSY_API_KEY",
  "ETSY_SHARED_SECRET",
  "ETSY_REDIRECT_URI",

  "OPENAI_API_KEY",

  "SUPABASE_URL",
  "SUPABASE_SECRET_KEY",

  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",

  "CRON_SECRET",

  "STRIPE_SECRET_KEY",
  "STRIPE_PRO_PRICE_ID",
  "STRIPE_WEBHOOK_SECRET",
];

const missingVariables =
  requiredEnvironmentVariables.filter(
    (name) =>
      !process.env[name]?.trim(),
  );

if (missingVariables.length > 0) {
  console.error(
    "Missing required SellerOS environment variables:",
  );

  for (const name of missingVariables) {
    console.error(`- ${name}`);
  }

  process.exit(1);
}

const urlVariables = [
  "APP_URL",
  "ETSY_REDIRECT_URI",
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
];

const invalidUrlVariables = [];

for (const name of urlVariables) {
  const value = process.env[name];

  try {
    new URL(value);
  } catch {
    invalidUrlVariables.push(name);
  }
}

if (invalidUrlVariables.length > 0) {
  console.error(
    "Invalid URL environment variables:",
  );

  for (const name of invalidUrlVariables) {
    console.error(`- ${name}`);
  }

  process.exit(1);
}

console.log(
  "SellerOS environment validation passed.",
);