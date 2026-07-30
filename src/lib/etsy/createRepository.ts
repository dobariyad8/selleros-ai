import "server-only";

import { NextRequest } from "next/server";

import {
  getEtsyAuthSession,
  type EtsyAuthSession,
} from "@/lib/etsy/auth";
import { EtsyRepository } from "@/lib/etsy/repository";
import { serverEnv } from "@/lib/env/server";

export type EtsyRepositorySession = {
  repository: EtsyRepository;
  authSession: EtsyAuthSession;
};

export async function createEtsyRepository(
  request: NextRequest,
): Promise<EtsyRepositorySession> {
  const authSession =
    await getEtsyAuthSession(request);

  const repository =
    new EtsyRepository({
      apiKey:
        serverEnv.etsyApiKey,
      sharedSecret:
        serverEnv.etsySharedSecret,
      accessToken:
        authSession.accessToken,
    });

  return {
    repository,
    authSession,
  };
}