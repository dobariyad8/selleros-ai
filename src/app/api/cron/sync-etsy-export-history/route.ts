import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  EtsyApiError,
} from "@/lib/etsy/client";
import {
  createStoredEtsyRepository,
} from "@/lib/etsy/createRepository";
import {
  sleep,
} from "@/lib/etsy/rateLimiter";
import { serverEnv } from "@/lib/env/server";
import {
  supabaseAdmin,
} from "@/lib/supabase/server";

export const runtime = "nodejs";

const CONNECTION_BATCH_SIZE = 25;
const HISTORY_BATCH_SIZE = 100;
const ETSY_REQUEST_DELAY_MILLISECONDS =
  300;

type EtsyConnectionRow = {
  etsy_user_id: string;
};

type ExportHistoryRow = {
  id: string;
  etsy_listing_id:
    | number
    | string;
  listing_title: string;
  listing_url: string | null;
  etsy_state: string;
};

type ListingSyncResult = {
  historyId: string;
  listingId: number;
  success: boolean;
  state?: string;
  error?: string;
};

type SellerSyncResult = {
  etsyUserId: string;
  success: boolean;
  processedListings: number;
  syncedListings: number;
  failedListings: number;
  error?: string;
  results: ListingSyncResult[];
};

function isAuthorized(
  request: NextRequest,
) {
  const authorization =
    request.headers.get(
      "authorization",
    );

  if (!authorization) {
    return false;
  }

  const [scheme, token] =
    authorization.split(" ");

  return (
    scheme?.toLowerCase() ===
      "bearer" &&
    token === serverEnv.cronSecret
  );
}

export async function POST(
  request: NextRequest,
) {
  const startedAt =
    new Date();

  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    const {
      data: connectionData,
      error: connectionsError,
    } = await supabaseAdmin
      .from("etsy_connections")
      .select("etsy_user_id")
      .eq(
        "connection_status",
        "active",
      )
      .order("updated_at", {
        ascending: true,
      })
      .limit(
        CONNECTION_BATCH_SIZE,
      )
      .returns<
        EtsyConnectionRow[]
      >();

    if (connectionsError) {
      console.error(
        "Daily Etsy sync connection lookup failed:",
        connectionsError,
      );

      throw new Error(
        "Active Etsy connections could not be loaded.",
      );
    }

    const sellerResults:
      SellerSyncResult[] = [];

    for (
      const connection of
        connectionData ?? []
    ) {
      const etsyUserId =
        connection.etsy_user_id;

      try {
        const {
          repository,
        } =
          await createStoredEtsyRepository(
            etsyUserId,
          );

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
          )
          .limit(
            HISTORY_BATCH_SIZE,
          )
          .returns<
            ExportHistoryRow[]
          >();

        if (historyError) {
          throw new Error(
            "The seller's export history could not be loaded.",
          );
        }

        const listingResults:
          ListingSyncResult[] = [];

        const historyRecords =
          historyData ?? [];

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
            listingResults.push({
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
              throw new Error(
                "The Etsy status was retrieved, but the export record could not be updated.",
              );
            }

            listingResults.push({
              historyId:
                record.id,
              listingId,
              success: true,
              state:
                nextState,
            });
          } catch (
            listingSyncError
          ) {
            const message =
              listingSyncError instanceof
              Error
                ? listingSyncError.message
                : "The Etsy listing could not be synchronized.";

            console.error(
              "Daily Etsy listing sync failed:",
              {
                etsyUserId,
                historyId:
                  record.id,
                listingId,
                listingSyncError,
              },
            );

            listingResults.push({
              historyId:
                record.id,
              listingId,
              success: false,
              error: message,
            });
          }

          const hasMoreListings =
            index <
            historyRecords.length -
              1;

          if (hasMoreListings) {
            await sleep(
              ETSY_REQUEST_DELAY_MILLISECONDS,
            );
          }
        }

        const syncedListings =
          listingResults.filter(
            (result) =>
              result.success,
          ).length;

        const failedListings =
          listingResults.length -
          syncedListings;

        const sellerError =
          failedListings > 0
            ? `${failedListings} Etsy listing status sync request(s) failed.`
            : null;

        const {
          error:
            connectionUpdateError,
        } = await supabaseAdmin
          .from(
            "etsy_connections",
          )
          .update({
            last_sync_at:
              new Date().toISOString(),
            last_error:
              sellerError,
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "etsy_user_id",
            etsyUserId,
          );

        if (
          connectionUpdateError
        ) {
          console.error(
            "Daily Etsy connection sync status update failed:",
            {
              etsyUserId,
              connectionUpdateError,
            },
          );
        }

        sellerResults.push({
          etsyUserId,
          success:
            failedListings === 0,
          processedListings:
            listingResults.length,
          syncedListings,
          failedListings,
          error:
            sellerError ??
            undefined,
          results:
            listingResults,
        });
      } catch (
        sellerSyncError
      ) {
        const message =
          sellerSyncError instanceof
          Error
            ? sellerSyncError.message
            : "The seller's Etsy connection could not be synchronized.";

        console.error(
          "Daily Etsy seller sync failed:",
          {
            etsyUserId,
            sellerSyncError,
          },
        );

        const {
          error:
            failureSaveError,
        } = await supabaseAdmin
          .from(
            "etsy_connections",
          )
          .update({
            last_error:
              message,
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "etsy_user_id",
            etsyUserId,
          );

        if (failureSaveError) {
          console.error(
            "Daily Etsy seller failure could not be saved:",
            {
              etsyUserId,
              failureSaveError,
            },
          );
        }

        sellerResults.push({
          etsyUserId,
          success: false,
          processedListings: 0,
          syncedListings: 0,
          failedListings: 0,
          error: message,
          results: [],
        });
      }
    }

    const processedSellers =
      sellerResults.length;

    const successfulSellers =
      sellerResults.filter(
        (result) =>
          result.success,
      ).length;

    const failedSellers =
      processedSellers -
      successfulSellers;

    const processedListings =
      sellerResults.reduce(
        (
          total,
          result,
        ) =>
          total +
          result.processedListings,
        0,
      );

    const syncedListings =
      sellerResults.reduce(
        (
          total,
          result,
        ) =>
          total +
          result.syncedListings,
        0,
      );

    const failedListings =
      sellerResults.reduce(
        (
          total,
          result,
        ) =>
          total +
          result.failedListings,
        0,
      );

    return NextResponse.json({
      success:
        failedSellers === 0 &&
        failedListings === 0,
      processedSellers,
      successfulSellers,
      failedSellers,
      processedListings,
      syncedListings,
      failedListings,
      connectionBatchLimit:
        CONNECTION_BATCH_SIZE,
      historyBatchLimit:
        HISTORY_BATCH_SIZE,
      startedAt:
        startedAt.toISOString(),
      finishedAt:
        new Date().toISOString(),
      results:
        sellerResults,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Daily Etsy status synchronization failed.";

    console.error(
      "Daily Etsy status synchronization failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: message,
        startedAt:
          startedAt.toISOString(),
        finishedAt:
          new Date().toISOString(),
      },
      {
        status: 500,
      },
    );
  }
}