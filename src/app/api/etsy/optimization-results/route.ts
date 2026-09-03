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
  createEtsyRepository,
  EtsyAccessError,
} from "@/lib/etsy/createRepository";
import {
  supabaseAdmin,
} from "@/lib/supabase/server";

export const runtime = "nodejs";

type SnapshotStage =
  | "baseline"
  | "day_7"
  | "day_14"
  | "day_30"
  | "manual";

type SnapshotRow = {
  id: string;
  update_history_id: string;
  snapshot_stage: SnapshotStage;
  listing_state: string | null;
  favorite_count: number;
  transaction_count: number;
  units_sold: number;
  revenue_amount:
    | number
    | string;
  revenue_currency: string | null;
  captured_at: string;
};

type UpdateHistoryRow = {
  id: string;
  etsy_shop_id:
    | number
    | string;
  etsy_shop_name: string | null;
  etsy_listing_id:
    | number
    | string;
  listing_title: string | null;
  updated_title: boolean;
  updated_description: boolean;
  updated_tags: boolean;
  update_status: string;
  updated_at: string;
};

type CaptureManualSnapshotRequest = {
  updateHistoryId?: unknown;
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

function toNumber(
  value: number | string,
) {
  const parsedValue =
    typeof value === "number"
      ? value
      : Number(value);

  return Number.isFinite(
    parsedValue,
  )
    ? parsedValue
    : 0;
}

function getStageRank(
  stage: SnapshotStage,
) {
  switch (stage) {
    case "baseline":
      return 0;

    case "day_7":
      return 1;

    case "day_14":
      return 2;

    case "day_30":
      return 3;

    case "manual":
      return 4;
  }
}

function getOutcome(
  favoriteChange: number,
  transactionChange: number,
  unitsSoldChange: number,
  revenueChange: number,
) {
  const hasImprovement =
    favoriteChange > 0 ||
    transactionChange > 0 ||
    unitsSoldChange > 0 ||
    revenueChange > 0;

  const hasDecline =
    favoriteChange < 0 ||
    transactionChange < 0 ||
    unitsSoldChange < 0 ||
    revenueChange < 0;

  if (
    hasImprovement &&
    !hasDecline
  ) {
    return "improved";
  }

  if (
    hasDecline &&
    !hasImprovement
  ) {
    return "declined";
  }

  if (
    hasImprovement &&
    hasDecline
  ) {
    return "mixed";
  }

  return "flat";
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
      "Optimization results Etsy connection lookup failed:",
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
    throw new Error(
      "Connect your Etsy shop before loading optimization results.",
    );
  }

  return etsyUserId;
}

export async function GET() {
  try {
    const etsyUserId =
      await getOwnedEtsyUserId();

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
          etsy_shop_name,
          etsy_listing_id,
          listing_title,
          updated_title,
          updated_description,
          updated_tags,
          update_status,
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
      .order(
        "updated_at",
        {
          ascending: false,
        },
      )
      .returns<
        UpdateHistoryRow[]
      >();

    if (historyError) {
      console.error(
        "Optimization result history lookup failed:",
        historyError,
      );

      throw new Error(
        "Optimization update history could not be loaded.",
      );
    }

    const historyRecords =
      historyData ?? [];

    const historyIds =
      historyRecords.map(
        (record) =>
          record.id,
      );

    let snapshotRows:
      SnapshotRow[] = [];

    if (
      historyIds.length > 0
    ) {
      const {
        data: snapshotData,
        error: snapshotError,
      } = await supabaseAdmin
        .from(
          "etsy_optimization_snapshots",
        )
        .select(
          `
            id,
            update_history_id,
            snapshot_stage,
            listing_state,
            favorite_count,
            transaction_count,
            units_sold,
            revenue_amount,
            revenue_currency,
            captured_at
          `,
        )
        .in(
          "update_history_id",
          historyIds,
        )
        .order(
          "captured_at",
          {
            ascending: true,
          },
        )
        .returns<
          SnapshotRow[]
        >();

      if (snapshotError) {
        console.error(
          "Optimization snapshot lookup failed:",
          snapshotError,
        );

        throw new Error(
          "Optimization snapshots could not be loaded.",
        );
      }

      snapshotRows =
        snapshotData ?? [];
    }

    const snapshotsByHistoryId =
      new Map<
        string,
        SnapshotRow[]
      >();

    for (
      const snapshot of
        snapshotRows
    ) {
      const snapshots =
        snapshotsByHistoryId.get(
          snapshot.update_history_id,
        ) ?? [];

      snapshots.push(
        snapshot,
      );

      snapshotsByHistoryId.set(
        snapshot.update_history_id,
        snapshots,
      );
    }

    const results =
      historyRecords.map(
        (record) => {
          const snapshots =
            snapshotsByHistoryId.get(
              record.id,
            ) ?? [];

          const baseline =
            snapshots.find(
              (snapshot) =>
                snapshot.snapshot_stage ===
                "baseline",
            ) ?? null;

          const scheduledSnapshots =
            snapshots
              .filter(
                (snapshot) =>
                  snapshot.snapshot_stage ===
                    "day_7" ||
                  snapshot.snapshot_stage ===
                    "day_14" ||
                  snapshot.snapshot_stage ===
                    "day_30",
              )
              .sort(
                (
                  first,
                  second,
                ) =>
                  getStageRank(
                    second.snapshot_stage,
                  ) -
                  getStageRank(
                    first.snapshot_stage,
                  ),
              );

          const latestManualSnapshot =
            snapshots
              .filter(
                (snapshot) =>
                  snapshot.snapshot_stage ===
                  "manual",
              )
              .sort(
                (
                  first,
                  second,
                ) =>
                  new Date(
                    second.captured_at,
                  ).getTime() -
                  new Date(
                    first.captured_at,
                  ).getTime(),
              )[0] ?? null;

          const latest =
            scheduledSnapshots[0] ??
            latestManualSnapshot;

          const favoriteChange =
            baseline &&
            latest
              ? latest.favorite_count -
                baseline.favorite_count
              : null;

          const transactionChange =
            baseline &&
            latest
              ? latest.transaction_count -
                baseline.transaction_count
              : null;

          const unitsSoldChange =
            baseline &&
            latest
              ? latest.units_sold -
                baseline.units_sold
              : null;

          const revenueChange =
            baseline &&
            latest
              ? Number(
                  (
                    toNumber(
                      latest.revenue_amount,
                    ) -
                    toNumber(
                      baseline.revenue_amount,
                    )
                  ).toFixed(2),
                )
              : null;

          const outcome =
            favoriteChange !== null &&
            transactionChange !== null &&
            unitsSoldChange !== null &&
            revenueChange !== null
              ? getOutcome(
                  favoriteChange,
                  transactionChange,
                  unitsSoldChange,
                  revenueChange,
                )
              : "pending";

          return {
            updateHistoryId:
              record.id,

            shopId:
              Number(
                record.etsy_shop_id,
              ),

            shopName:
              record.etsy_shop_name,

            listingId:
              Number(
                record.etsy_listing_id,
              ),

            listingTitle:
              record.listing_title,

            updatedFields: {
              title:
                record.updated_title,
              description:
                record.updated_description,
              tags:
                record.updated_tags,
            },

            updatedAt:
              record.updated_at,

            baseline:
              baseline
                ? {
                    stage:
                      baseline.snapshot_stage,
                    listingState:
                      baseline.listing_state,
                    favoriteCount:
                      baseline.favorite_count,
                    transactionCount:
                      baseline.transaction_count,
                    unitsSold:
                      baseline.units_sold,
                    revenueAmount:
                      toNumber(
                        baseline.revenue_amount,
                      ),
                    revenueCurrency:
                      baseline.revenue_currency,
                    capturedAt:
                      baseline.captured_at,
                  }
                : null,

            latestSnapshot:
              latest
                ? {
                    stage:
                      latest.snapshot_stage,
                    listingState:
                      latest.listing_state,
                    favoriteCount:
                      latest.favorite_count,
                    transactionCount:
                      latest.transaction_count,
                    unitsSold:
                      latest.units_sold,
                    revenueAmount:
                      toNumber(
                        latest.revenue_amount,
                      ),
                    revenueCurrency:
                      latest.revenue_currency,
                    capturedAt:
                      latest.captured_at,
                  }
                : null,

            changes: {
              favorites:
                favoriteChange,
              transactions:
                transactionChange,
              unitsSold:
                unitsSoldChange,
              revenue:
                revenueChange,
            },

            outcome,

            availableStages:
              snapshots.map(
                (snapshot) =>
                  snapshot.snapshot_stage,
              ),
          };
        },
      );

    const completedResults =
      results.filter(
        (result) =>
          result.outcome !==
          "pending",
      );

    const summary = {
      totalOptimizations:
        results.length,

      pending:
        results.filter(
          (result) =>
            result.outcome ===
            "pending",
        ).length,

      improved:
        results.filter(
          (result) =>
            result.outcome ===
            "improved",
        ).length,

      declined:
        results.filter(
          (result) =>
            result.outcome ===
            "declined",
        ).length,

      mixed:
        results.filter(
          (result) =>
            result.outcome ===
            "mixed",
        ).length,

      flat:
        results.filter(
          (result) =>
            result.outcome ===
            "flat",
        ).length,

      totalFavoriteChange:
        completedResults.reduce(
          (
            total,
            result,
          ) =>
            total +
            (result.changes
              .favorites ?? 0),
          0,
        ),

      totalTransactionChange:
        completedResults.reduce(
          (
            total,
            result,
          ) =>
            total +
            (result.changes
              .transactions ?? 0),
          0,
        ),

      totalUnitsSoldChange:
        completedResults.reduce(
          (
            total,
            result,
          ) =>
            total +
            (result.changes
              .unitsSold ?? 0),
          0,
        ),

      totalRevenueChange:
        Number(
          completedResults
            .reduce(
              (
                total,
                result,
              ) =>
                total +
                (result.changes
                  .revenue ?? 0),
              0,
            )
            .toFixed(2),
        ),
    };

    return NextResponse.json({
      success: true,
      summary,
      results,
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
        : "Optimization results could not be loaded.";

    console.error(
      "Optimization results retrieval failed:",
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
    await requireProSubscription();

    const body =
      (await request.json()) as CaptureManualSnapshotRequest;

    const updateHistoryId =
      readText(
        body.updateHistoryId,
      );

    if (
      !updateHistoryId ||
      !isValidUuid(
        updateHistoryId,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A valid update history ID is required.",
        },
        {
          status: 400,
        },
      );
    }

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
        "etsy_listing_update_history",
      )
      .select(
        `
          id,
          etsy_shop_id,
          etsy_listing_id,
          listing_title,
          update_status
        `,
      )
      .eq(
        "id",
        updateHistoryId,
      )
      .eq(
        "etsy_user_id",
        etsyUserId,
      )
      .maybeSingle();

    if (historyError) {
      console.error(
        "Manual optimization snapshot history lookup failed:",
        historyError,
      );

      throw new Error(
        "The tracked optimization could not be loaded.",
      );
    }

    if (!historyRecord) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The tracked optimization was not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      historyRecord.update_status !==
      "success"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only successful Etsy updates can be measured.",
        },
        {
          status: 400,
        },
      );
    }

    const shopId =
      Number(
        historyRecord.etsy_shop_id,
      );

    const listingId =
      Number(
        historyRecord.etsy_listing_id,
      );

    if (
      !Number.isInteger(shopId) ||
      shopId < 1 ||
      !Number.isInteger(
        listingId,
      ) ||
      listingId < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The tracked optimization does not contain valid Etsy IDs.",
        },
        {
          status: 400,
        },
      );
    }

    const {
      data: baseline,
      error: baselineError,
    } = await supabaseAdmin
      .from(
        "etsy_optimization_snapshots",
      )
      .select("id")
      .eq(
        "update_history_id",
        updateHistoryId,
      )
      .eq(
        "snapshot_stage",
        "baseline",
      )
      .maybeSingle();

    if (baselineError) {
      throw new Error(
        "The optimization baseline could not be verified.",
      );
    }

    if (!baseline) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This optimization does not have a baseline snapshot.",
        },
        {
          status: 400,
        },
      );
    }

    const metrics =
      await repository.getListingPerformanceMetrics(
        shopId,
        listingId,
      );

    const {
      error: snapshotError,
    } = await supabaseAdmin
      .from(
        "etsy_optimization_snapshots",
      )
      .upsert(
        {
          etsy_user_id:
            etsyUserId,

          update_history_id:
            updateHistoryId,

          etsy_shop_id:
            shopId,

          etsy_listing_id:
            listingId,

          listing_title:
            metrics.listingTitle ??
            historyRecord.listing_title,

          snapshot_stage:
            "manual",

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
        },
        {
          onConflict:
            "update_history_id,snapshot_stage",
        },
      );

    if (snapshotError) {
      console.error(
        "Manual optimization snapshot save failed:",
        snapshotError,
      );

      throw new Error(
        "The Etsy metrics were retrieved, but the manual snapshot could not be saved.",
      );
    }

    const response =
      NextResponse.json({
        success: true,

        updateHistoryId,

        listingId,

        snapshot: {
          stage:
            "manual",

          listingState:
            metrics.listingState,

          favoriteCount:
            metrics.favoriteCount,

          transactionCount:
            metrics.transactionCount,

          unitsSold:
            metrics.unitsSold,

          revenueAmount:
            metrics.revenueAmount,

          revenueCurrency:
            metrics.revenueCurrency,

          capturedAt:
            metrics.capturedAt,
        },
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
        : "The manual optimization snapshot could not be captured.";

    console.error(
      "Manual optimization snapshot failed:",
      error,
    );

    const status =
      message.includes(
        "not found",
      )
        ? 404
        : message.includes(
              "valid",
            ) ||
              message.includes(
                "successful",
              ) ||
              message.includes(
                "baseline",
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