import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const {
  getUserMock,
  maybeSingleMock,
  eqMock,
  selectMock,
  fromMock,
} = vi.hoisted(() => {
  const maybeSingleMock = vi.fn();

  const eqMock = vi.fn(() => ({
    maybeSingle: maybeSingleMock,
  }));

  const selectMock = vi.fn(() => ({
    eq: eqMock,
  }));

  const fromMock = vi.fn(() => ({
    select: selectMock,
  }));

  const getUserMock = vi.fn();

  return {
    getUserMock,
    maybeSingleMock,
    eqMock,
    selectMock,
    fromMock,
  };
});

vi.mock(
  "@/lib/supabase/auth-server",
  () => ({
    createSupabaseServerClient:
      vi.fn(async () => ({
        auth: {
          getUser: getUserMock,
        },
      })),
  }),
);

vi.mock(
  "@/lib/supabase/server",
  () => ({
    supabaseAdmin: {
      from: fromMock,
    },
  }),
);

import {
  requireProSubscription,
  SubscriptionAccessError,
} from "@/lib/billing/requireProSubscription";

describe(
  "requireProSubscription",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it(
      "throws UNAUTHENTICATED when there is no logged-in user",
      async () => {
        getUserMock.mockResolvedValue({
          data: {
            user: null,
          },
          error: null,
        });

        await expect(
          requireProSubscription(),
        ).rejects.toMatchObject({
          name: "SubscriptionAccessError",
          status: 401,
          code: "UNAUTHENTICATED",
        });
      },
    );

    it(
      "throws PRO_REQUIRED when the user does not have an active Pro subscription",
      async () => {
        const user = {
          id: "user-123",
        };

        getUserMock.mockResolvedValue({
          data: {
            user,
          },
          error: null,
        });

        maybeSingleMock.mockResolvedValue({
          data: {
            plan_key:
              "early_access",
            subscription_status:
              "early_access",
          },
          error: null,
        });

        await expect(
          requireProSubscription(),
        ).rejects.toMatchObject({
          name: "SubscriptionAccessError",
          status: 403,
          code: "PRO_REQUIRED",
        });
      },
    );

    it(
      "returns the user and subscription for active Pro access",
      async () => {
        const user = {
          id: "user-123",
        };

        const subscription = {
          plan_key: "pro",
          subscription_status:
            "active",
        };

        getUserMock.mockResolvedValue({
          data: {
            user,
          },
          error: null,
        });

        maybeSingleMock.mockResolvedValue({
          data: subscription,
          error: null,
        });

        await expect(
          requireProSubscription(),
        ).resolves.toEqual({
          user,
          subscription,
        });

        expect(
          fromMock,
        ).toHaveBeenCalledWith(
          "selleros_subscriptions",
        );

        expect(
          eqMock,
        ).toHaveBeenCalledWith(
          "user_id",
          "user-123",
        );
      },
    );

    it(
      "allows trialing Pro subscriptions",
      async () => {
        const user = {
          id: "user-123",
        };

        const subscription = {
          plan_key: "pro",
          subscription_status:
            "trialing",
        };

        getUserMock.mockResolvedValue({
          data: {
            user,
          },
          error: null,
        });

        maybeSingleMock.mockResolvedValue({
          data: subscription,
          error: null,
        });

        await expect(
          requireProSubscription(),
        ).resolves.toEqual({
          user,
          subscription,
        });
      },
    );

    it(
      "throws a server error when the subscription lookup fails",
      async () => {
        getUserMock.mockResolvedValue({
          data: {
            user: {
              id: "user-123",
            },
          },
          error: null,
        });

        maybeSingleMock.mockResolvedValue({
          data: null,
          error: {
            message:
              "Database unavailable",
          },
        });

        await expect(
          requireProSubscription(),
        ).rejects.toThrow(
          "SellerOS could not verify your subscription.",
        );
      },
    );

    it(
      "creates SubscriptionAccessError with the expected properties",
      () => {
        const error =
          new SubscriptionAccessError(
            "Test",
            403,
            "PRO_REQUIRED",
          );

        expect(
          error,
        ).toBeInstanceOf(Error);

        expect(error.name).toBe(
          "SubscriptionAccessError",
        );

        expect(error.status).toBe(
          403,
        );

        expect(error.code).toBe(
          "PRO_REQUIRED",
        );
      },
    );
  },
);