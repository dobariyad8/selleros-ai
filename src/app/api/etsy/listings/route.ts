import { NextRequest, NextResponse } from "next/server";

import {
  createEtsyRepository,
  EtsyAccessError,
} from "@/lib/etsy/createRepository";
import { EtsyApiError } from "@/lib/etsy/client";
import { applyEtsyAuthCookies } from "@/lib/etsy/auth";

export async function GET(request: NextRequest) {
  try {
    const {
        repository,
        authSession,
      } = await createEtsyRepository(
        request,
      );

      const result =
        await repository.getActiveListings();

      const response =
        NextResponse.json({
          success: true,
          ...result,
        });
      
      return applyEtsyAuthCookies(
        response,
        authSession,
      );
  } catch (error) {
    console.error(error);

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