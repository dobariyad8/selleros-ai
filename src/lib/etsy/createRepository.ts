import { NextRequest } from "next/server";
import { EtsyRepository } from "./repository";

export function createEtsyRepository(
  request: NextRequest
): EtsyRepository {
  const apiKey = process.env.ETSY_API_KEY;
  const sharedSecret = process.env.ETSY_SHARED_SECRET;

  if (!apiKey || !sharedSecret) {
    throw new Error(
      "ETSY_API_KEY or ETSY_SHARED_SECRET is missing."
    );
  }

  console.log(
  "Available cookies:",
  request.cookies.getAll()
    );
  const accessToken =
    request.cookies.get("etsy_access_token")?.value;

  if (!accessToken) {
    throw new Error(
      "No Etsy access token was found."
    );
  }

  return new EtsyRepository({
    apiKey,
    sharedSecret,
    accessToken,
  });
}