import "server-only";

import { NextRequest } from "next/server";

import {
  refreshEtsyToken,
  type EtsyAuthSession,
} from "@/lib/etsy/auth";
import { serverEnv } from "@/lib/env/server";
import { EtsyRepository } from "@/lib/etsy/repository";
import { createSupabaseServerClient } from "@/lib/supabase/auth-server";
import { supabaseAdmin } from "@/lib/supabase/server";

const TOKEN_REFRESH_BUFFER_MILLISECONDS =
  5 * 60 * 1000;

export class EtsyAccessError extends Error {
  status: number;
  code:
    | "UNAUTHENTICATED"
    | "ETSY_NOT_CONNECTED"
    | "ETSY_CONNECTION_INACTIVE";

  constructor(
    message: string,
    status: number,
    code:
      | "UNAUTHENTICATED"
      | "ETSY_NOT_CONNECTED"
      | "ETSY_CONNECTION_INACTIVE",
  ) {
    super(message);

    this.name = "EtsyAccessError";
    this.status = status;
    this.code = code;
  }
}

export type EtsyRepositorySession = {
  repository: EtsyRepository;
  authSession: EtsyAuthSession;
};

type StoredEtsyConnection = {
  etsy_user_id: string;
  access_token: string;
  refresh_token: string;
  access_token_expires_at: string;
  connection_status:
    | "active"
    | "expired"
    | "revoked";
};

export type StoredEtsyRepositorySession = {
  repository: EtsyRepository;
  etsyUserId: string;
  accessToken: string;
  wasRefreshed: boolean;
};

function createRepositoryFromAccessToken(
  accessToken: string,
) {
  return new EtsyRepository({
    apiKey: serverEnv.etsyApiKey,
    sharedSecret:
      serverEnv.etsySharedSecret,
    accessToken,
  });
}

function shouldRefreshStoredToken(
  expiresAt: string,
) {
  const expirationTime =
    new Date(expiresAt).getTime();

  if (!Number.isFinite(expirationTime)) {
    return true;
  }

  return (
    expirationTime -
      TOKEN_REFRESH_BUFFER_MILLISECONDS <=
    Date.now()
  );
}

async function refreshStoredConnection(
  connection: StoredEtsyConnection,
) {
  try {
    const refreshed =
      await refreshEtsyToken(
        connection.refresh_token,
      );

    if (
      refreshed.userId !==
      connection.etsy_user_id
    ) {
      throw new Error(
        "The refreshed Etsy token belongs to a different seller.",
      );
    }

    const now =
      new Date().toISOString();

    const accessTokenExpiresAt =
      new Date(
        Date.now() +
          refreshed.expiresIn * 1000,
      ).toISOString();

    const {
      error: refreshSaveError,
    } = await supabaseAdmin
      .from("etsy_connections")
      .update({
        access_token:
          refreshed.accessToken,
        refresh_token:
          refreshed.refreshToken,
        access_token_expires_at:
          accessTokenExpiresAt,
        connection_status: "active",
        last_refreshed_at: now,
        last_error: null,
        updated_at: now,
      })
      .eq(
        "etsy_user_id",
        connection.etsy_user_id,
      );

    if (refreshSaveError) {
      console.error(
        "Refreshed Etsy connection save failed:",
        refreshSaveError,
      );

      throw new Error(
        "The Etsy token was refreshed, but the stored connection could not be updated.",
      );
    }

    return {
      accessToken:
        refreshed.accessToken,
      refreshToken:
        refreshed.refreshToken,
      expiresIn:
        refreshed.expiresIn,
      wasRefreshed: true,
    };
  } catch (refreshError) {
    const message =
      refreshError instanceof Error
        ? refreshError.message
        : "The stored Etsy connection could not be refreshed.";

    console.error(
      "Stored Etsy token refresh failed:",
      {
        etsyUserId:
          connection.etsy_user_id,
        refreshError,
      },
    );

    const now =
      new Date().toISOString();

    const {
      error: failureSaveError,
    } = await supabaseAdmin
      .from("etsy_connections")
      .update({
        connection_status: "expired",
        last_error: message,
        updated_at: now,
      })
      .eq(
        "etsy_user_id",
        connection.etsy_user_id,
      );

    if (failureSaveError) {
      console.error(
        "Stored Etsy connection failure state could not be saved:",
        failureSaveError,
      );
    }

    throw refreshError;
  }
}

export async function createEtsyRepository(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _request: NextRequest,
): Promise<EtsyRepositorySession> {
  const supabase =
    await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new EtsyAccessError(
      "Log in to SellerOS before accessing Etsy data.",
      401,
      "UNAUTHENTICATED",
    );
  }

  const {
    data: connectionData,
    error: connectionError,
  } = await supabaseAdmin
    .from("etsy_connections")
    .select(
      `
        etsy_user_id,
        access_token,
        refresh_token,
        access_token_expires_at,
        connection_status
      `,
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (connectionError) {
    console.error(
      "SellerOS Etsy connection load failed:",
      connectionError,
    );

    throw new Error(
      "Your Etsy connection could not be loaded.",
    );
  }

  if (!connectionData) {
    throw new EtsyAccessError(
      "Connect your Etsy shop before continuing.",
      403,
      "ETSY_NOT_CONNECTED",
    );
  }

  const connection =
    connectionData as StoredEtsyConnection;

  if (
    connection.connection_status !==
    "active"
  ) {
    throw new Error(
      "Your Etsy connection is not active. Reconnect your Etsy shop.",
    );
  }

  let accessToken =
    connection.access_token;

  let refreshToken =
    connection.refresh_token;

  let wasRefreshed = false;
  let expiresIn: number | null = null;

  if (
    shouldRefreshStoredToken(
      connection.access_token_expires_at,
    )
  ) {
    const refreshed =
      await refreshStoredConnection(
        connection,
      );

    accessToken =
      refreshed.accessToken;

    refreshToken =
      refreshed.refreshToken;

    wasRefreshed =
      refreshed.wasRefreshed;

    expiresIn =
      refreshed.expiresIn;
  }

  return {
    repository:
      createRepositoryFromAccessToken(
        accessToken,
      ),
    authSession: {
      accessToken,
      refreshToken,
      userId:
        connection.etsy_user_id,
      wasRefreshed,
      expiresIn,
    },
  };
}

export async function createStoredEtsyRepository(
  etsyUserId: string,
): Promise<StoredEtsyRepositorySession> {
  const normalizedUserId =
    etsyUserId.trim();

  if (!normalizedUserId) {
    throw new Error(
      "A valid Etsy user ID is required.",
    );
  }

  const {
    data: connectionData,
    error: connectionError,
  } = await supabaseAdmin
    .from("etsy_connections")
    .select(
      `
        etsy_user_id,
        access_token,
        refresh_token,
        access_token_expires_at,
        connection_status
      `,
    )
    .eq(
      "etsy_user_id",
      normalizedUserId,
    )
    .maybeSingle();

  if (connectionError) {
    console.error(
      "Stored Etsy connection load failed:",
      connectionError,
    );

    throw new Error(
      "The stored Etsy connection could not be loaded.",
    );
  }

  if (!connectionData) {
    throw new Error(
      "No stored Etsy connection was found for this seller.",
    );
  }

  const connection =
    connectionData as StoredEtsyConnection;

  if (
    connection.connection_status !==
    "active"
  ) {
    throw new Error(
      "The stored Etsy connection is not active.",
    );
  }

  let accessToken =
    connection.access_token;

  let wasRefreshed = false;

  if (
    shouldRefreshStoredToken(
      connection.access_token_expires_at,
    )
  ) {
    const refreshed =
      await refreshStoredConnection(
        connection,
      );

    accessToken =
      refreshed.accessToken;

    wasRefreshed =
      refreshed.wasRefreshed;
  }

  return {
    repository:
      createRepositoryFromAccessToken(
        accessToken,
      ),
    etsyUserId:
      normalizedUserId,
    accessToken,
    wasRefreshed,
  };
}