import { NextRequest, NextResponse } from "next/server";

import { createEtsyRepository } from "@/lib/etsy/createRepository";
import { EtsyApiError } from "@/lib/etsy/client";

export async function GET(request: NextRequest) {
  try {
    const repository = createEtsyRepository(request);

    const result =
      await repository.getActiveListings();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error(error);

    if (error instanceof EtsyApiError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        {
          status: error.status,
        }
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
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Unknown server error.",
      },
      {
        status: 500,
      }
    );
  }
}