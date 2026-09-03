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
  selectEqMock,
  selectMock,
  updateEqMock,
  updateMock,
  fromMock,
  refreshEtsyTokenMock,
  EtsyRepositoryMock,
} = vi.hoisted(() => {
  const getUserMock = vi.fn();

  const maybeSingleMock = vi.fn();

  const selectEqMock = vi.fn(() => ({
    maybeSingle: maybeSingleMock,
  }));

  const selectMock = vi.fn(() => ({
    eq: selectEqMock,
  }));

  const updateEqMock = vi.fn();

  const updateMock = vi.fn(() => ({
    eq: updateEqMock,
  }));

  const fromMock = vi.fn(() => ({
    select: selectMock,
    update: updateMock,
  }));

  const refreshEtsyTokenMock =
    vi.fn();

  const EtsyRepositoryMock =
    vi.fn(function (
      this: {
        options?: unknown;
      },
      options: unknown,
    ) {
      this.options = options;
    });

  return {
    getUserMock,
    maybeSingleMock,
    selectEqMock,
    selectMock,
    updateEqMock,
    updateMock,
    fromMock,
    refreshEtsyTokenMock,
    EtsyRepositoryMock,
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

vi.mock("@/lib/etsy/auth", () => ({
  refreshEtsyToken:
    refreshEtsyTokenMock,
}));

vi.mock("@/lib/env/server", () => ({
  serverEnv: {
    etsyApiKey: "test-api-key",
    etsySharedSecret:
      "test-shared-secret",
  },
}));

vi.mock(
  "@/lib/etsy/repository",
  () => ({
    EtsyRepository:
      EtsyRepositoryMock,
  }),
);

import {
  createEtsyRepository,
  EtsyAccessError,
} from "@/lib/etsy/createRepository";

function createActiveConnection(
  overrides: Partial<{
    etsy_user_id: string;
    access_token: string;
    refresh_token: string;
    access_token_expires_at: string;
    connection_status:
      | "active"
      | "expired"
      | "revoked";
  }> = {},
) {
  return {
    etsy_user_id: "etsy-user-123",
    access_token: "access-token",
    refresh_token: "refresh-token",
    access_token_expires_at:
      "2999-01-01T00:00:00.000Z",
    connection_status:
      "active" as const,
    ...overrides,
  };
}

describe(
  "createEtsyRepository",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      updateEqMock.mockResolvedValue({
        error: null,
      });
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
          createEtsyRepository(
            {} as never,
          ),
        ).rejects.toMatchObject({
          name: "EtsyAccessError",
          status: 401,
          code: "UNAUTHENTICATED",
        });

        expect(
          fromMock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "throws ETSY_NOT_CONNECTED when the user has no Etsy connection",
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
          error: null,
        });

        await expect(
          createEtsyRepository(
            {} as never,
          ),
        ).rejects.toMatchObject({
          name: "EtsyAccessError",
          status: 403,
          code: "ETSY_NOT_CONNECTED",
        });

        expect(
          selectEqMock,
        ).toHaveBeenCalledWith(
          "user_id",
          "user-123",
        );
      },
    );

    it(
      "throws ETSY_CONNECTION_INACTIVE when the stored connection is inactive",
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
          data: createActiveConnection({
            connection_status:
              "expired",
          }),
          error: null,
        });

        await expect(
          createEtsyRepository(
            {} as never,
          ),
        ).rejects.toMatchObject({
          name: "EtsyAccessError",
          status: 403,
          code:
            "ETSY_CONNECTION_INACTIVE",
        });

        expect(
          refreshEtsyTokenMock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "returns an Etsy repository for an active unexpired connection",
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
          data: createActiveConnection(),
          error: null,
        });

        const result =
          await createEtsyRepository(
            {} as never,
          );

        expect(
          result.authSession,
        ).toEqual({
          accessToken:
            "access-token",
          refreshToken:
            "refresh-token",
          userId:
            "etsy-user-123",
          wasRefreshed: false,
          expiresIn: null,
        });

        expect(
          refreshEtsyTokenMock,
        ).not.toHaveBeenCalled();

        expect(
          EtsyRepositoryMock,
        ).toHaveBeenCalledWith({
          apiKey: "test-api-key",
          sharedSecret:
            "test-shared-secret",
          accessToken:
            "access-token",
        });
      },
    );

    it(
      "refreshes an expired token and saves the new connection",
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
          data: createActiveConnection({
            access_token_expires_at:
              "2000-01-01T00:00:00.000Z",
          }),
          error: null,
        });

        refreshEtsyTokenMock.mockResolvedValue({
          accessToken:
            "new-access-token",
          refreshToken:
            "new-refresh-token",
          expiresIn: 3600,
          userId: "etsy-user-123",
        });

        const result =
          await createEtsyRepository(
            {} as never,
          );

        expect(
          refreshEtsyTokenMock,
        ).toHaveBeenCalledWith(
          "refresh-token",
        );

        expect(
          result.authSession,
        ).toEqual({
          accessToken:
            "new-access-token",
          refreshToken:
            "new-refresh-token",
          userId:
            "etsy-user-123",
          wasRefreshed: true,
          expiresIn: 3600,
        });

        expect(
          updateMock,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            access_token:
              "new-access-token",
            refresh_token:
              "new-refresh-token",
            connection_status:
              "active",
            last_error: null,
          }),
        );

        expect(
          updateEqMock,
        ).toHaveBeenCalledWith(
          "etsy_user_id",
          "etsy-user-123",
        );
      },
    );

    it(
      "marks the connection expired when token refresh fails",
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
          data: createActiveConnection({
            access_token_expires_at:
              "2000-01-01T00:00:00.000Z",
          }),
          error: null,
        });

        refreshEtsyTokenMock.mockRejectedValue(
          new Error(
            "Refresh token rejected",
          ),
        );

        await expect(
          createEtsyRepository(
            {} as never,
          ),
        ).rejects.toMatchObject({
          name: "EtsyAccessError",
          status: 403,
          code:
            "ETSY_CONNECTION_INACTIVE",
        });

        expect(
          updateMock,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            connection_status:
              "expired",
            last_error:
              "Refresh token rejected",
          }),
        );
      },
    );

    it(
      "creates EtsyAccessError with the expected properties",
      () => {
        const error =
          new EtsyAccessError(
            "Test",
            403,
            "ETSY_NOT_CONNECTED",
          );

        expect(
          error,
        ).toBeInstanceOf(Error);

        expect(error.name).toBe(
          "EtsyAccessError",
        );

        expect(error.status).toBe(
          403,
        );

        expect(error.code).toBe(
          "ETSY_NOT_CONNECTED",
        );
      },
    );
  },
);