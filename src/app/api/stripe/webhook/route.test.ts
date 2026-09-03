import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const {
  constructEventMock,
  retrieveSubscriptionMock,
  maybeSingleMock,
  selectEqMock,
  selectMock,
  upsertMock,
  fromMock,
} = vi.hoisted(() => {
  const constructEventMock =
    vi.fn();

  const retrieveSubscriptionMock =
    vi.fn();

  const maybeSingleMock =
    vi.fn();

  const selectEqMock = vi.fn(
    () => ({
      maybeSingle:
        maybeSingleMock,
    }),
  );

  const selectMock = vi.fn(
    () => ({
      eq: selectEqMock,
    }),
  );

  const upsertMock = vi.fn();

  const fromMock = vi.fn(
    () => ({
      select: selectMock,
      upsert: upsertMock,
    }),
  );

  return {
    constructEventMock,
    retrieveSubscriptionMock,
    maybeSingleMock,
    selectEqMock,
    selectMock,
    upsertMock,
    fromMock,
  };
});

vi.mock(
  "@/lib/stripe/server",
  () => ({
    stripe: {
      webhooks: {
        constructEvent:
          constructEventMock,
      },
      subscriptions: {
        retrieve:
          retrieveSubscriptionMock,
      },
    },
  }),
);

vi.mock("@/lib/env/server", () => ({
  serverEnv: {
    stripeWebhookSecret:
      "whsec_test_secret",
    stripeProPriceId:
      "price_pro_test",
  },
}));

vi.mock(
  "@/lib/supabase/server",
  () => ({
    supabaseAdmin: {
      from: fromMock,
    },
  }),
);

import { POST } from "@/app/api/stripe/webhook/route";

function createSubscription(
  overrides: Record<
    string,
    unknown
  > = {},
) {
  return {
    id: "sub_123",
    customer: "cus_123",
    status: "active",
    metadata: {
      selleros_user_id:
        "user-123",
    },
    cancel_at_period_end:
      false,
    cancel_at: null,
    canceled_at: null,
    items: {
      data: [
        {
          price: {
            id: "price_pro_test",
          },
          current_period_start:
            1_700_000_000,
          current_period_end:
            1_702_592_000,
        },
      ],
    },
    ...overrides,
  };
}

function createEvent(
  overrides: Record<
    string,
    unknown
  > = {},
) {
  return {
    id: "evt_123",
    created: 1_700_000_000,
    type:
      "customer.subscription.updated",
    data: {
      object:
        createSubscription(),
    },
    ...overrides,
  };
}

function createRequest() {
  return new Request(
    "http://localhost/api/stripe/webhook",
    {
      method: "POST",
      headers: {
        "stripe-signature":
          "valid-signature",
      },
      body: '{"test":true}',
    },
  );
}

describe(
  "Stripe webhook POST",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      maybeSingleMock.mockResolvedValue({
        data: null,
        error: null,
      });

      upsertMock.mockResolvedValue({
        error: null,
      });
    });

    it(
      "returns 400 when the Stripe signature is missing",
      async () => {
        const request =
          new Request(
            "http://localhost/api/stripe/webhook",
            {
              method: "POST",
              body: "{}",
            },
          );

        const response =
          await POST(
            request as never,
          );

        expect(
          response.status,
        ).toBe(400);

        await expect(
          response.json(),
        ).resolves.toEqual({
          success: false,
          error:
            "Missing Stripe signature.",
        });

        expect(
          constructEventMock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "returns 400 when Stripe signature verification fails",
      async () => {
        constructEventMock.mockImplementation(
          () => {
            throw new Error(
              "Invalid signature",
            );
          },
        );

        const request =
          new Request(
            "http://localhost/api/stripe/webhook",
            {
              method: "POST",
              headers: {
                "stripe-signature":
                  "bad-signature",
              },
              body:
                '{"test":true}',
            },
          );

        const response =
          await POST(
            request as never,
          );

        expect(
          response.status,
        ).toBe(400);

        await expect(
          response.json(),
        ).resolves.toEqual({
          success: false,
          error:
            "Invalid Stripe webhook signature.",
        });

        expect(
          constructEventMock,
        ).toHaveBeenCalledWith(
          '{"test":true}',
          "bad-signature",
          "whsec_test_secret",
        );
      },
    );

    it(
      "saves Pro entitlement for the trusted Stripe price",
      async () => {
        const event =
          createEvent();

        const subscription =
          createSubscription();

        constructEventMock.mockReturnValue(
          event,
        );

        retrieveSubscriptionMock.mockResolvedValue(
          subscription,
        );

        const response =
          await POST(
            createRequest() as never,
          );

        expect(
          response.status,
        ).toBe(200);

        await expect(
          response.json(),
        ).resolves.toEqual({
          received: true,
        });

        expect(
          retrieveSubscriptionMock,
        ).toHaveBeenCalledWith(
          "sub_123",
        );

        expect(
          fromMock,
        ).toHaveBeenCalledWith(
          "selleros_subscriptions",
        );

        expect(
          upsertMock,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: "user-123",
            stripe_customer_id:
              "cus_123",
            stripe_subscription_id:
              "sub_123",
            stripe_price_id:
              "price_pro_test",
            plan_key: "pro",
            subscription_status:
              "active",
            cancel_at_period_end:
              false,
            last_stripe_event_created:
              1_700_000_000,
            last_stripe_event_id:
              "evt_123",
          }),
          {
            onConflict:
              "user_id",
          },
        );
      },
    );

    it(
      "rejects subscriptions using an unsupported Stripe price",
      async () => {
        const event =
          createEvent();

        const subscription =
          createSubscription({
            items: {
              data: [
                {
                  price: {
                    id:
                      "price_wrong",
                  },
                  current_period_start:
                    1_700_000_000,
                  current_period_end:
                    1_702_592_000,
                },
              ],
            },
          });

        constructEventMock.mockReturnValue(
          event,
        );

        retrieveSubscriptionMock.mockResolvedValue(
          subscription,
        );

        const response =
          await POST(
            createRequest() as never,
          );

        expect(
          response.status,
        ).toBe(500);

        await expect(
          response.json(),
        ).resolves.toEqual({
          success: false,
          error:
            "Stripe subscription sub_123 uses an unsupported SellerOS price.",
        });

        expect(
          upsertMock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "ignores duplicate Stripe events",
      async () => {
        const event =
          createEvent();

        constructEventMock.mockReturnValue(
          event,
        );

        retrieveSubscriptionMock.mockResolvedValue(
          createSubscription(),
        );

        maybeSingleMock.mockResolvedValue({
          data: {
            last_stripe_event_created:
              1_700_000_000,
            last_stripe_event_id:
              "evt_123",
          },
          error: null,
        });

        const response =
          await POST(
            createRequest() as never,
          );

        expect(
          response.status,
        ).toBe(200);

        await expect(
          response.json(),
        ).resolves.toEqual({
          received: true,
        });

        expect(
          upsertMock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "ignores an older Stripe event when newer state is already stored",
      async () => {
        const event =
          createEvent({
            id: "evt_old",
            created:
              1_700_000_000,
          });

        constructEventMock.mockReturnValue(
          event,
        );

        retrieveSubscriptionMock.mockResolvedValue(
          createSubscription(),
        );

        maybeSingleMock.mockResolvedValue({
          data: {
            last_stripe_event_created:
              1_700_000_100,
            last_stripe_event_id:
              "evt_new",
          },
          error: null,
        });

        const response =
          await POST(
            createRequest() as never,
          );

        expect(
          response.status,
        ).toBe(200);

        await expect(
          response.json(),
        ).resolves.toEqual({
          received: true,
        });

        expect(
          upsertMock,
        ).not.toHaveBeenCalled();
      },
    );
  },
);