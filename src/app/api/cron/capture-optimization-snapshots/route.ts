import {
  NextRequest,
  NextResponse,
} from "next/server";

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

type SnapshotStage =
  | "baseline"
  | "day_7"
  | "day_14"
  | "day_30"
  | "manual";

type EtsyConnectionRow = {
  etsy_user_id: string;
};

type UpdateHistoryRow = {
  id: string;

  etsy_shop_id:
    | number
    | string;

  etsy_listing_id:
    | number
    | string;

  listing_title:
    | string
    | null;

  updated_at: string;
};

type ExistingSnapshotRow = {
  update_history_id: string;
  snapshot_stage: SnapshotStage;
};

type SnapshotResult = {
  updateHistoryId: string;
  listingId: number;
  stage?: SnapshotStage;
  success: boolean;
  skipped?: boolean;
  reason?: string;
  error?: string;
};

type SellerSnapshotResult = {
  etsyUserId: string;
  success: boolean;
  processedUpdates: number;
  capturedSnapshots: number;
  skippedUpdates: number;
  failedSnapshots: number;
  error?: string;
  results: SnapshotResult[];
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

function getAgeInDays(
  updatedAt: string,
  now: Date,
) {
  const updateDate =
    new Date(updatedAt);

  if (
    Number.isNaN(
      updateDate.getTime(),
    )
  ) {
    return null;
  }

  const milliseconds =
    now.getTime() -
    updateDate.getTime();

  return (
    milliseconds /
    (1000 * 60 * 60 * 24)
  );
}

/**
 * Returns the next snapshot that is currently due.
 *
 * Only one stage is captured per update during each cron run.
 * Under normal daily execution, this produces snapshots at
 * approximately 7, 14, and 30 days.
 */
function getNextDueStage(
  ageInDays: number,
  existingStages: Set<SnapshotStage>,
): SnapshotStage | null {
  if (
    ageInDays >= 7 &&
    !existingStages.has(
      "day_7",
    )
  ) {
    return "day_7";
  }

  if (
    ageInDays >= 14 &&
    !existingStages.has(
      "day_14",
    )
  ) {
    return "day_14";
  }

  if (
    ageInDays >= 30 &&
    !existingStages.has(
      "day_30",
    )
  ) {
    return "day_30";
  }

  return null;
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
      .from(
        "etsy_connections",
      )
      .select(
        "etsy_user_id",
      )
      .eq(
        "connection_status",
        "active",
      )
      .order(
        "updated_at",
        {
          ascending: true,
        },
      )
      .limit(
        CONNECTION_BATCH_SIZE,
      )
      .returns<
        EtsyConnectionRow[]
      >();

    if (connectionsError) {
      console.error(
        "Optimization snapshot connection lookup failed:",
        connectionsError,
      );

      throw new Error(
        "Active Etsy connections could not be loaded.",
      );
    }

    const sellerResults:
      SellerSnapshotResult[] = [];

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

        /*
         * Only successful Etsy content updates are eligible
         * for performance tracking.
         */
        const {
          data: historyData,
          error: historyError,
        } = await supabaseAdmin
          .from(
            "etsy_listing_update_history",
          )
          .select(
            `
              id,
              etsy_shop_id,
              etsy_listing_id,
              listing_title,
              updated_at
            `,
          )
          .eq(
            "etsy_user_id",
            etsyUserId,
          )
          .eq(
            "update_status",
            "success",
          )
          .lte(
            "updated_at",
            new Date(
              startedAt.getTime() -
                7 *
                  24 *
                  60 *
                  60 *
                  1000,
            ).toISOString(),
          )
          .order(
            "updated_at",
            {
              ascending: true,
            },
          )
          .limit(
            HISTORY_BATCH_SIZE,
          )
          .returns<
            UpdateHistoryRow[]
          >();

        if (historyError) {
          throw new Error(
            "The seller's listing update history could not be loaded.",
          );
        }

        const historyRecords =
          historyData ?? [];

        const historyIds =
          historyRecords.map(
            (record) =>
              record.id,
          );

        let existingSnapshots:
          ExistingSnapshotRow[] = [];

        if (
          historyIds.length > 0
        ) {
          const {
            data: snapshotData,
            error: snapshotsError,
          } = await supabaseAdmin
            .from(
              "etsy_optimization_snapshots",
            )
            .select(
              `
                update_history_id,
                snapshot_stage
              `,
            )
            .in(
              "update_history_id",
              historyIds,
            )
            .returns<
              ExistingSnapshotRow[]
            >();

          if (snapshotsError) {
            throw new Error(
              "Existing optimization snapshots could not be loaded.",
            );
          }

          existingSnapshots =
            snapshotData ?? [];
        }

        const stagesByHistoryId =
          new Map<
            string,
            Set<SnapshotStage>
          >();

        for (
          const snapshot of
            existingSnapshots
        ) {
          const stages =
            stagesByHistoryId.get(
              snapshot.update_history_id,
            ) ??
            new Set<SnapshotStage>();

          stages.add(
            snapshot.snapshot_stage,
          );

          stagesByHistoryId.set(
            snapshot.update_history_id,
            stages,
          );
        }

        const snapshotResults:
          SnapshotResult[] = [];

        for (
          let index = 0;
          index <
          historyRecords.length;
          index += 1
        ) {
          const record =
            historyRecords[index];

          const shopId =
            Number(
              record.etsy_shop_id,
            );

          const listingId =
            Number(
              record.etsy_listing_id,
            );

          if (
            !Number.isInteger(
              shopId,
            ) ||
            shopId < 1 ||
            !Number.isInteger(
              listingId,
            ) ||
            listingId < 1
          ) {
            snapshotResults.push({
              updateHistoryId:
                record.id,
              listingId,
              success: false,
              error:
                "The update-history record does not contain valid Etsy shop and listing IDs.",
            });

            continue;
          }

          const ageInDays =
            getAgeInDays(
              record.updated_at,
              startedAt,
            );

          if (ageInDays === null) {
            snapshotResults.push({
              updateHistoryId:
                record.id,
              listingId,
              success: false,
              error:
                "The update-history record contains an invalid update date.",
            });

            continue;
          }

          const existingStages =
            stagesByHistoryId.get(
              record.id,
            ) ??
            new Set<SnapshotStage>();

          if (
            !existingStages.has(
              "baseline",
            )
          ) {
            snapshotResults.push({
              updateHistoryId:
                record.id,
              listingId,
              success: true,
              skipped: true,
              reason:
                "Performance tracking has no baseline snapshot.",
            });

            continue;
          }

          const dueStage =
            getNextDueStage(
              ageInDays,
              existingStages,
            );

          if (!dueStage) {
            snapshotResults.push({
              updateHistoryId:
                record.id,
              listingId,
              success: true,
              skipped: true,
              reason:
                ageInDays < 7
                  ? "No performance snapshot is due yet."
                  : "All currently due snapshots have already been captured.",
            });

            continue;
          }

          try {
            const metrics =
              await repository.getListingPerformanceMetrics(
                shopId,
                listingId,
              );

            const {
              error:
                snapshotInsertError,
            } = await supabaseAdmin
              .from(
                "etsy_optimization_snapshots",
              )
              .insert({
                etsy_user_id:
                  etsyUserId,

                update_history_id:
                  record.id,

                etsy_shop_id:
                  shopId,

                etsy_listing_id:
                  listingId,

                listing_title:
                  metrics.listingTitle ??
                  record.listing_title,

                snapshot_stage:
                  dueStage,

                listing_state:
                  metrics.listingState,

                favorite_count:
                  metrics.favoriteCount,

                transaction_count:
                  metrics.transactionCount,

                units_sold:
                  metrics.unitsSold,

                revenue_amount:
                  metrics.revenueAmount,

                revenue_currency:
                  metrics.revenueCurrency,

                snapshot_error:
                  null,

                captured_at:
                  metrics.capturedAt,
              });

            if (
              snapshotInsertError
            ) {
              /*
               * A duplicate means another invocation already
               * captured this stage. Treat that as a safe skip.
               */
              if (
                snapshotInsertError.code ===
                "23505"
              ) {
                snapshotResults.push({
                  updateHistoryId:
                    record.id,
                  listingId,
                  stage:
                    dueStage,
                  success: true,
                  skipped: true,
                  reason:
                    "This snapshot stage was already captured.",
                });

                continue;
              }

              throw new Error(
                snapshotInsertError.message,
              );
            }

            existingStages.add(
              dueStage,
            );

            stagesByHistoryId.set(
              record.id,
              existingStages,
            );

            snapshotResults.push({
              updateHistoryId:
                record.id,
              listingId,
              stage:
                dueStage,
              success: true,
            });
          } catch (
            snapshotError
          ) {
            const message =
              snapshotError instanceof
              Error
                ? snapshotError.message
                : "The optimization snapshot could not be captured.";

            console.error(
              "Scheduled optimization snapshot failed:",
              {
                etsyUserId,
                updateHistoryId:
                  record.id,
                listingId,
                dueStage,
                snapshotError,
              },
            );

            snapshotResults.push({
              updateHistoryId:
                record.id,
              listingId,
              stage:
                dueStage,
              success: false,
              error:
                message,
            });
          }

          const hasMoreRecords =
            index <
            historyRecords.length -
              1;

          if (hasMoreRecords) {
            await sleep(
              ETSY_REQUEST_DELAY_MILLISECONDS,
            );
          }
        }

        const capturedSnapshots =
          snapshotResults.filter(
            (result) =>
              result.success &&
              !result.skipped,
          ).length;

        const skippedUpdates =
          snapshotResults.filter(
            (result) =>
              result.skipped,
          ).length;

        const failedSnapshots =
          snapshotResults.filter(
            (result) =>
              !result.success,
          ).length;

        const sellerError =
          failedSnapshots > 0
            ? `${failedSnapshots} optimization snapshot request(s) failed.`
            : null;

        sellerResults.push({
          etsyUserId,
          success:
            failedSnapshots === 0,
          processedUpdates:
            snapshotResults.length,
          capturedSnapshots,
          skippedUpdates,
          failedSnapshots,
          error:
            sellerError ??
            undefined,
          results:
            snapshotResults,
        });
      } catch (
        sellerError
      ) {
        const message =
          sellerError instanceof
          Error
            ? sellerError.message
            : "The seller's optimization snapshots could not be processed.";

        console.error(
          "Scheduled seller optimization snapshot collection failed:",
          {
            etsyUserId,
            sellerError,
          },
        );

        sellerResults.push({
          etsyUserId,
          success: false,
          processedUpdates: 0,
          capturedSnapshots: 0,
          skippedUpdates: 0,
          failedSnapshots: 0,
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

    const processedUpdates =
      sellerResults.reduce(
        (
          total,
          result,
        ) =>
          total +
          result.processedUpdates,
        0,
      );

    const capturedSnapshots =
      sellerResults.reduce(
        (
          total,
          result,
        ) =>
          total +
          result.capturedSnapshots,
        0,
      );

    const skippedUpdates =
      sellerResults.reduce(
        (
          total,
          result,
        ) =>
          total +
          result.skippedUpdates,
        0,
      );

    const failedSnapshots =
      sellerResults.reduce(
        (
          total,
          result,
        ) =>
          total +
          result.failedSnapshots,
        0,
      );

    return NextResponse.json({
      success:
        failedSellers === 0 &&
        failedSnapshots === 0,

      processedSellers,
      successfulSellers,
      failedSellers,

      processedUpdates,
      capturedSnapshots,
      skippedUpdates,
      failedSnapshots,

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
        : "Scheduled optimization snapshot collection failed.";

    console.error(
      "Scheduled optimization snapshot collection failed:",
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