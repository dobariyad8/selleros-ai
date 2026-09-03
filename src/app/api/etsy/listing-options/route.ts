import { NextRequest, NextResponse } from "next/server";

import {
  applyEtsyAuthCookies,
} from "@/lib/etsy/auth";
import { EtsyApiError } from "@/lib/etsy/client";
import {
  createEtsyRepository,
  EtsyAccessError,
} from "@/lib/etsy/createRepository";

import {
  requireProSubscription,
  SubscriptionAccessError,
} from "@/lib/billing/requireProSubscription";

export async function GET(
  request: NextRequest,
) {
  try {
    await requireProSubscription();
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
    if (
      error instanceof
      SubscriptionAccessError
    ) {
      return NextResponse.json(
        {
          success: false,
          code: error.code,
          error: error.message,
        },
        {
          status: error.status,
        },
      );
    }

    if (error instanceof EtsyAccessError) {
      return NextResponse.json(
        {
          success: false,
          code: error.code,
          error: error.message,
        },
        {
          status: error.status,
        },
      );
    }
  
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

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        {
          status: 500,
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