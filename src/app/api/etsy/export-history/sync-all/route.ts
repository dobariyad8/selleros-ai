import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  applyEtsyAuthCookies,
  type EtsyAuthSession,
} from "@/lib/etsy/auth";
import {
  EtsyApiError,
} from "@/lib/etsy/client";
import {
  createEtsyRepository,
} from "@/lib/etsy/createRepository";
import {
  sleep,
} from "@/lib/etsy/rateLimiter";
import {
  supabaseAdmin,
} from "@/lib/supabase/server";

export const runtime = "nodejs";

const SYNC_DELAY_MILLISECONDS =
  300;

type ExportHistoryRecord = {
  id: string;
  etsy_listing_id:
    | number
    | string;
  listing_title: string;
  listing_url: string | null;
  etsy_state: string;
};

type SyncedExportResult = {
  historyId: string;
  listingId: number;
  success: boolean;
  state?: string;
  listingTitle?: string;
  listingUrl?: string | null;
  lastEtsySyncedAt?: string;
  error?: string;
};

export async function POST(
  request: NextRequest,
) {
  let authSession:
    | EtsyAuthSession
    | null = null;

  try {
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
      data: historyData,
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
        "Etsy export history batch sync load failed:",
        historyError,
      );

      throw new Error(
        "The Etsy export history could not be loaded for synchronization.",
      );
    }

    const historyRecords =
      (historyData ??
        []) as ExportHistoryRecord[];

    const results:
      SyncedExportResult[] = [];

    for (
      let index = 0;
      index <
      historyRecords.length;
      index += 1
    ) {
      const record =
        historyRecords[index];

      const listingId =
        Number(
          record.etsy_listing_id,
        );

      if (
        !Number.isInteger(
          listingId,
        ) ||
        listingId < 1
      ) {
        results.push({
          historyId:
            record.id,
          listingId,
          success: false,
          error:
            "The export record does not contain a valid Etsy listing ID.",
        });

        continue;
      }

      let nextState =
        record.etsy_state;

      let nextTitle =
        record.listing_title;

      let nextUrl =
        record.listing_url;

      try {
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
        } catch (etsyError) {
          if (
            etsyError instanceof
              EtsyApiError &&
            etsyError.status ===
              404
          ) {
            nextState =
              "deleted";
          } else {
            throw etsyError;
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
            record.id,
          )
          .eq(
            "etsy_user_id",
            etsyUserId,
          );

        if (updateError) {
          console.error(
            "Etsy export history batch record update failed:",
            {
              historyId:
                record.id,
              listingId,
              updateError,
            },
          );

          throw new Error(
            "The Etsy status was retrieved, but the export record could not be updated.",
          );
        }

        results.push({
          historyId:
            record.id,
          listingId,
          success: true,
          state:
            nextState,
          listingTitle:
            nextTitle,
          listingUrl:
            nextUrl,
          lastEtsySyncedAt:
            syncedAt,
        });
      } catch (syncError) {
        console.error(
          "Etsy export history batch item sync failed:",
          {
            historyId:
              record.id,
            listingId,
            syncError,
          },
        );

        results.push({
          historyId:
            record.id,
          listingId,
          success: false,
          error:
            syncError instanceof
              Error
              ? syncError.message
              : "The Etsy listing status could not be synchronized.",
        });
      }

      const hasMoreRecords =
        index <
        historyRecords.length - 1;

      if (hasMoreRecords) {
        await sleep(
          SYNC_DELAY_MILLISECONDS,
        );
      }
    }

    const successfulCount =
      results.filter(
        (result) =>
          result.success,
      ).length;

    const failedCount =
      results.length -
      successfulCount;

    const response =
      NextResponse.json({
        success: true,
        totalCount:
          results.length,
        successfulCount,
        failedCount,
        results,
      });

    return applyEtsyAuthCookies(
      response,
      authSession,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Etsy listing statuses could not be synchronized.";

    console.error(
      "Etsy export history batch synchronization failed:",
      error,
    );

    const status =
      error instanceof EtsyApiError
        ? error.status
        : message.includes(
              "Connect your Etsy shop",
            ) ||
            message.includes(
              "access token",
            ) ||
            message.includes(
              "connection has expired",
            )
          ? 401
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