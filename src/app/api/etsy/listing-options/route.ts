import { NextRequest, NextResponse } from "next/server";

import {
  applyEtsyAuthCookies,
} from "@/lib/etsy/auth";
import { EtsyApiError } from "@/lib/etsy/client";
import {
  createEtsyRepository,
} from "@/lib/etsy/createRepository";

export async function GET(
  request: NextRequest,
) {
  try {
    const {
      repository,
      authSession,
    } =
      await createEtsyRepository(
        request,
      );

    const shop =
      await repository.getShop();

    const [
      shippingProfiles,
      readinessStates,
      taxonomy,
    ] = await Promise.all([
      repository.getShippingProfiles(
        shop.shopId,
      ),
      repository.getReadinessStates(
        shop.shopId,
      ),
      repository.getSellerTaxonomy(),
    ]);

    const response =
      NextResponse.json({
        success: true,
        shop,
        shippingProfiles,
        readinessStates,
        taxonomy,
      });

    return applyEtsyAuthCookies(
      response,
      authSession,
    );
  } catch (error) {
    console.error(
      "Could not load Etsy listing options:",
      error,
    );

    if (error instanceof EtsyApiError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        {
          status: error.status,
        },
      );
    }

    if (error instanceof Error) {
      const isAuthenticationError =
        error.message.includes(
          "Connect your Etsy shop",
        ) ||
        error.message.includes(
          "access token",
        ) ||
        error.message.includes(
          "connection has expired",
        );

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        {
          status:
            isAuthenticationError
              ? 401
              : 500,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Could not load Etsy listing options.",
      },
      {
        status: 500,
      },
    );
  }
}