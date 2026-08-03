import "server-only";

import { NextRequest } from "next/server";

import {
  getEtsyAuthSession,
  refreshEtsyToken,
  type EtsyAuthSession,
} from "@/lib/etsy/auth";
import { serverEnv } from "@/lib/env/server";
import { EtsyRepository } from "@/lib/etsy/repository";
import { supabaseAdmin } from "@/lib/supabase/server";

const TOKEN_REFRESH_BUFFER_MILLISECONDS =
  5 * 60 * 1000;

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
    apiKey:
      serverEnv.etsyApiKey,
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

  if (
    !Number.isFinite(
      expirationTime,
    )
  ) {
    return true;
  }

  return (
    expirationTime -
      TOKEN_REFRESH_BUFFER_MILLISECONDS <=
    Date.now()
  );
}

export async function createEtsyRepository(
  request: NextRequest,
): Promise<EtsyRepositorySession> {
  const authSession =
    await getEtsyAuthSession(
      request,
    );

  const repository =
    createRepositoryFromAccessToken(
      authSession.accessToken,
    );

  return {
    repository,
    authSession,
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

  let wasRefreshed =
    false;

  if (
    shouldRefreshStoredToken(
      connection.access_token_expires_at,
    )
  ) {
    try {
      const refreshed =
        await refreshEtsyToken(
          connection.refresh_token,
        );

      if (
        refreshed.userId !==
        normalizedUserId
      ) {
        throw new Error(
          "The refreshed Etsy token belongs to a different seller.",
        );
      }

      accessToken =
        refreshed.accessToken;

      wasRefreshed =
        true;

      const now =
        new Date().toISOString();

      const accessTokenExpiresAt =
        new Date(
          Date.now() +
            refreshed.expiresIn *
              1000,
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
          connection_status:
            "active",
          last_refreshed_at:
            now,
          last_error:
            null,
          updated_at:
            now,
        })
        .eq(
          "etsy_user_id",
          normalizedUserId,
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
    } catch (refreshError) {
      const message =
        refreshError instanceof Error
          ? refreshError.message
          : "The stored Etsy connection could not be refreshed.";

      console.error(
        "Stored Etsy token refresh failed:",
        {
          etsyUserId:
            normalizedUserId,
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
          connection_status:
            "expired",
          last_error:
            message,
          updated_at:
            now,
        })
        .eq(
          "etsy_user_id",
          normalizedUserId,
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