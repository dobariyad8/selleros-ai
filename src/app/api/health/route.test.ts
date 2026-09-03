import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.resetModules();
});

function setValidEnvironment() {
  process.env.APP_URL = "http://localhost:3000";

  process.env.ETSY_API_KEY = "test_etsy_api_key";
  process.env.ETSY_SHARED_SECRET =
    "test_etsy_shared_secret";
  process.env.ETSY_REDIRECT_URI =
    "http://localhost:3000/api/auth/etsy/callback";

  process.env.OPENAI_API_KEY =
    "test_openai_api_key";

  process.env.SUPABASE_URL =
    "https://example.supabase.co";
  process.env.SUPABASE_SECRET_KEY =
    "test_supabase_secret_key";

  process.env.NEXT_PUBLIC_SUPABASE_URL =
    "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
    "test_supabase_publishable_key";

  process.env.CRON_SECRET = "test_cron_secret";

  process.env.STRIPE_SECRET_KEY =
    "sk_test_placeholder";
  process.env.STRIPE_PRO_PRICE_ID =
    "price_test_placeholder";
  process.env.STRIPE_WEBHOOK_SECRET =
    "whsec_test_placeholder";
}

describe("GET /api/health", () => {
  it("returns 200 when application configuration is complete", async () => {
    setValidEnvironment();

    const { GET } = await import("./route");

    const response = GET();
    const body = await response.json();

    expect(response.status).toBe(200);

    expect(body).toMatchObject({
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
    });

    expect(body.timestamp).toEqual(
      expect.any(String),
    );
  });

  it("returns 503 when required configuration is missing", async () => {
    setValidEnvironment();

    delete process.env.STRIPE_WEBHOOK_SECRET;

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { GET } = await import("./route");

    const response = GET();
    const body = await response.json();

    expect(response.status).toBe(503);

    expect(body).toMatchObject({
      status: "error",
      service: "SellerOS AI",
      message:
        "Required application configuration is missing.",
    });

    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("does not expose secret values in the response", async () => {
    setValidEnvironment();

    const { GET } = await import("./route");

    const response = GET();
    const responseText = await response.text();

    expect(responseText).not.toContain(
      "test_etsy_shared_secret",
    );
    expect(responseText).not.toContain(
      "test_supabase_secret_key",
    );
    expect(responseText).not.toContain(
      "sk_test_placeholder",
    );
    expect(responseText).not.toContain(
      "whsec_test_placeholder",
    );
  });
});