import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  requireProSubscription,
  SubscriptionAccessError,
} from "@/lib/billing/requireProSubscription";
import {
  applyEtsyAuthCookies,
  type EtsyAuthSession,
} from "@/lib/etsy/auth";
import {
  EtsyApiError,
} from "@/lib/etsy/client";
import {
  createEtsyRepository,
  EtsyAccessError,
} from "@/lib/etsy/createRepository";
import {
  supabaseAdmin,
} from "@/lib/supabase/server";

export const runtime = "nodejs";

type SyncExportHistoryRequest = {
  historyId?: unknown;
};

function readText(
  value: unknown,
) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function isValidUuid(
  value: string,
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function getOwnedEtsyUserId() {
  const { user } =
    await requireProSubscription();

  const {
    data: connection,
    error: connectionError,
  } = await supabaseAdmin
    .from("etsy_connections")
    .select("etsy_user_id")
    .eq("user_id", user.id)
    .eq(
      "connection_status",
      "active",
    )
    .maybeSingle();

  if (connectionError) {
    console.error(
      "Export history Etsy connection lookup failed:",
      connectionError,
    );

    throw new Error(
      "SellerOS could not load your Etsy connection.",
    );
  }

  const etsyUserId =
    typeof connection?.etsy_user_id ===
    "string"
      ? connection.etsy_user_id.trim()
      : "";

  if (!etsyUserId) {
    throw new EtsyAccessError(
      "Connect your Etsy shop before loading export history.",
      403,
      "ETSY_NOT_CONNECTED",
    );
  }

  return etsyUserId;
}

export async function GET() {
  try {
    const etsyUserId =
      await getOwnedEtsyUserId();

    const {
      data: history,
      error: historyError,
    } = await supabaseAdmin
      .from(
        "etsy_export_history",
      )
      .select(
        `
          id,
          source_project_id,
          etsy_shop_id,
          etsy_shop_name,
          etsy_listing_id,
          listing_title,
          listing_url,
          uploaded_image_count,
          etsy_state,
          project_cleanup_completed,
          project_cleanup_error,
          exported_at,
          last_etsy_synced_at
        `,
      )
      .eq(
        "etsy_user_id",
        etsyUserId,
      )
      .order(
        "exported_at",
        {
          ascending: false,
        },
      );

    if (historyError) {
      console.error(
        "Etsy export history load failed:",
        historyError,
      );

      throw new Error(
        "The Etsy export history could not be loaded.",
      );
    }

    const exports =
      (history ?? []).map(
        (record) => ({
          id:
            record.id,
          sourceProjectId:
            record.source_project_id,
          shopId:
            record.etsy_shop_id,
          shopName:
            record.etsy_shop_name,
          listingId:
            record.etsy_listing_id,
          listingTitle:
            record.listing_title,
          listingUrl:
            record.listing_url,
          uploadedImageCount:
            record.uploaded_image_count,
          state:
            record.etsy_state,
          projectCleanupCompleted:
            record.project_cleanup_completed,
          projectCleanupError:
            record.project_cleanup_error,
          exportedAt:
            record.exported_at,
          lastEtsySyncedAt:
            record.last_etsy_synced_at,
        }),
      );

    return NextResponse.json({
      success: true,
      exports,
    });
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

    const message =
      error instanceof Error
        ? error.message
        : "The Etsy export history could not be loaded.";

    console.error(
      "Etsy export history retrieval failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
  request: NextRequest,
) {
  let authSession:
    | EtsyAuthSession
    | null = null;

  try {
    /*
     * Export status synchronization is a
     * SellerOS Pro feature.
     */
    await requireProSubscription();

    const body =
      (await request.json()) as SyncExportHistoryRequest;

    const historyId =
      readText(
        body.historyId,
      );

    if (
      !historyId ||
      !isValidUuid(historyId)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A valid export history ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * createEtsyRepository now resolves the Etsy
     * connection from the authenticated SellerOS
     * user's user_id, so the browser Etsy cookie
     * is not used as the ownership authority.
     */
    const {
      repository,
      authSession:
        repositoryAuthSession,
    } =
      await createEtsyRepository(
        request,
      );

    authSession =
      repositoryAuthSession;

    const etsyUserId =
      authSession.userId;

    const {
      data: historyRecord,
      error: historyError,
    } = await supabaseAdmin
      .from(
        "etsy_export_history",
      )
      .select(
        `
          id,
          etsy_listing_id,
          listing_title,
          listing_url,
          etsy_state
        `,
      )
      .eq(
        "id",
        historyId,
      )
      .eq(
        "etsy_user_id",
        etsyUserId,
      )
      .maybeSingle();

    if (historyError) {
      console.error(
        "Etsy export history sync lookup failed:",
        historyError,
      );

      throw new Error(
        "The export history record could not be loaded.",
      );
    }

    if (!historyRecord) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The export history record was not found.",
        },
        {
          status: 404,
        },
      );
    }

    const listingId =
      Number(
        historyRecord.etsy_listing_id,
      );

    if (
      !Number.isInteger(listingId) ||
      listingId < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The export history record does not contain a valid Etsy listing ID.",
        },
        {
          status: 400,
        },
      );
    }

    let nextState =
      historyRecord.etsy_state;

    let nextTitle =
      historyRecord.listing_title;

    let nextUrl =
      historyRecord.listing_url;

    try {
      const listing =
        await repository.getListingStatus(
          listingId,
        );

      nextState =
        listing.state;

      nextTitle =
        listing.title?.trim() ||
        nextTitle;

      nextUrl =
        listing.url?.trim() ||
        nextUrl;
    } catch (error) {
      if (
        error instanceof EtsyApiError &&
        error.status === 404
      ) {
        nextState =
          "deleted";
      } else {
        throw error;
      }
    }

    const syncedAt =
      new Date().toISOString();

    const {
      error: updateError,
    } = await supabaseAdmin
      .from(
        "etsy_export_history",
      )
      .update({
        etsy_state:
          nextState,
        listing_title:
          nextTitle,
        listing_url:
          nextUrl,
        last_etsy_synced_at:
          syncedAt,
      })
      .eq(
        "id",
        historyId,
      )
      .eq(
        "etsy_user_id",
        etsyUserId,
      );

    if (updateError) {
      console.error(
        "Etsy export history sync update failed:",
        updateError,
      );

      throw new Error(
        "The Etsy listing status was retrieved, but the export history record could not be updated.",
      );
    }

    const response =
      NextResponse.json({
        success: true,
        historyId,
        listingId,
        listingTitle:
          nextTitle,
        listingUrl:
          nextUrl,
        state:
          nextState,
        lastEtsySyncedAt:
          syncedAt,
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

    const message =
      error instanceof Error
        ? error.message
        : "The Etsy listing status could not be synchronized.";

    console.error(
      "Etsy export history synchronization failed:",
      error,
    );

    const status =
      error instanceof EtsyApiError
        ? error.status
        : message.includes(
              "not found",
            )
          ? 404
          : message.includes(
                "valid",
              ) ||
              message.includes(
                "required",
              )
            ? 400
            : 500;

    const response =
      NextResponse.json(
        {
          success: false,
          error: message,
        },
        {
          status,
        },
      );

    return authSession
      ? applyEtsyAuthCookies(
          response,
          authSession,
        )
      : response;
  }
}