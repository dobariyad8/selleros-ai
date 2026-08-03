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
  supabaseAdmin,
} from "@/lib/supabase/server";

export const runtime = "nodejs";

type UpdateListingContentRequest = {
  listingId?: unknown;

  updateTitle?: unknown;
  updateDescription?: unknown;
  updateTags?: unknown;

  title?: unknown;
  description?: unknown;
  tags?: unknown;
};

function readText(
  value: unknown,
) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function readPositiveInteger(
  value: unknown,
) {
  const parsedValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  return Number.isInteger(
    parsedValue,
  ) && parsedValue > 0
    ? parsedValue
    : null;
}

function readTags(
  value: unknown,
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (
        tag,
      ): tag is string =>
        typeof tag === "string",
    )
    .map((tag) =>
      tag.trim(),
    )
    .filter(Boolean);
}

export async function POST(
  request: NextRequest,
) {
  let authSession:
    | EtsyAuthSession
    | null = null;

  let historyContext: {
    etsyUserId: string;
    shopId: number;
    shopName: string;
    listingId: number;
    listingTitle: string | null;

    updateTitle: boolean;
    updateDescription: boolean;
    updateTags: boolean;

    previousTitle: string | null;
    previousDescription: string | null;
    previousTags: string[];

    newTitle: string | null;
    newDescription: string | null;
    newTags: string[];
  } | null = null;

  try {
    const body =
      (await request.json()) as UpdateListingContentRequest;

    const listingId =
      readPositiveInteger(
        body.listingId,
      );

    if (!listingId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A valid Etsy listing ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const updateTitle =
      body.updateTitle === true;

    const updateDescription =
      body.updateDescription === true;

    const updateTags =
      body.updateTags === true;

    if (
      !updateTitle &&
      !updateDescription &&
      !updateTags
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Select at least one listing field to update.",
        },
        {
          status: 400,
        },
      );
    }

    const title =
      readText(body.title);

    const description =
      readText(
        body.description,
      );

    const tags =
      readTags(body.tags);

    if (
      updateTitle &&
      !title
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The recommended title cannot be empty.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      updateDescription &&
      !description
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The recommended description cannot be empty.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      updateTags &&
      tags.length < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Select at least one valid Etsy tag.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      updateTags &&
      tags.length > 13
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Etsy allows a maximum of 13 tags.",
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

    /*
     * Derive the shop from the authenticated Etsy account.
     */
    const shop =
      await repository.getShop();

    /*
     * Load the listing before changing it so the update
     * history contains the real previous Etsy values.
     */
    const currentListing =
      await repository.getListingStatus(
        listingId,
      );

    const previousTitle =
      currentListing.title?.trim() ||
      null;

    const previousDescription =
      currentListing.description?.trim() ||
      null;

    const previousTags =
      Array.isArray(
        currentListing.tags,
      )
        ? currentListing.tags
            .map((tag) =>
              tag.trim(),
            )
            .filter(Boolean)
        : [];

    historyContext = {
      etsyUserId:
        authSession.userId,
      shopId:
        shop.shopId,
      shopName:
        shop.shopName,
      listingId,
      listingTitle:
        previousTitle,

      updateTitle,
      updateDescription,
      updateTags,

      previousTitle,
      previousDescription,
      previousTags,

      newTitle:
        updateTitle
          ? title
          : previousTitle,
      newDescription:
        updateDescription
          ? description
          : previousDescription,
      newTags:
        updateTags
          ? tags
          : previousTags,
    };

    const updatedListing =
      await repository.updateListingContent({
        shopId:
          shop.shopId,
        listingId,
        title:
          updateTitle
            ? title
            : undefined,
        description:
          updateDescription
            ? description
            : undefined,
        tags:
          updateTags
            ? tags
            : undefined,
      });

    const finalTitle =
      updatedListing.title?.trim() ||
      historyContext.newTitle;

    const finalDescription =
      updatedListing.description?.trim() ||
      historyContext.newDescription;

    const finalTags =
      Array.isArray(
        updatedListing.tags,
      )
        ? updatedListing.tags
            .map((tag) =>
              tag.trim(),
            )
            .filter(Boolean)
        : historyContext.newTags;

    const {
      data: insertedHistory,
      error: historyInsertError,
    } = await supabaseAdmin
      .from(
        "etsy_listing_update_history",
      )
      .insert({
        etsy_user_id:
          historyContext.etsyUserId,
    
        etsy_shop_id:
          historyContext.shopId,
        etsy_shop_name:
          historyContext.shopName,
    
        etsy_listing_id:
          historyContext.listingId,
        listing_title:
          finalTitle ??
          historyContext.listingTitle,
    
        updated_title:
          historyContext.updateTitle,
        updated_description:
          historyContext.updateDescription,
        updated_tags:
          historyContext.updateTags,
    
        previous_title:
          historyContext.previousTitle,
        new_title:
          finalTitle,
    
        previous_description:
          historyContext.previousDescription,
        new_description:
          finalDescription,
    
        previous_tags:
          historyContext.previousTags,
        new_tags:
          finalTags,
    
        update_status:
          "success",
        error_message:
          null,
      })
      .select("id")
      .single();
    
    if (historyInsertError) {
      console.error(
        "Etsy listing update history insert failed:",
        historyInsertError,
      );
    }

    let performanceTrackingStarted =
      false;

    let performanceTrackingError:
      | string
      | null = null;

    if (insertedHistory?.id) {
      try {
        const metrics =
          await repository.getListingPerformanceMetrics(
            shop.shopId,
            listingId,
          );

        const {
          error: snapshotInsertError,
        } = await supabaseAdmin
          .from(
            "etsy_optimization_snapshots",
          )
          .insert({
            etsy_user_id:
              historyContext.etsyUserId,

            update_history_id:
              insertedHistory.id,

            etsy_shop_id:
              historyContext.shopId,

            etsy_listing_id:
              historyContext.listingId,

            listing_title:
              metrics.listingTitle ??
              finalTitle ??
              historyContext.listingTitle,

            snapshot_stage:
              "baseline",

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

        if (snapshotInsertError) {
          throw new Error(
            snapshotInsertError.message,
          );
        }

        performanceTrackingStarted =
          true;
      } catch (snapshotError) {
        performanceTrackingError =
          snapshotError instanceof Error
            ? snapshotError.message
            : "The baseline performance snapshot could not be captured.";

        console.error(
          "Etsy optimization baseline snapshot failed:",
          snapshotError,
        );
      }
    } else {
      performanceTrackingError =
        "The update history record was not created, so performance tracking could not begin.";
    }

    const response =
      NextResponse.json({
        success: true,
        listingId:
          updatedListing.listing_id,
        shopId:
          updatedListing.shop_id ??
          shop.shopId,
        shopName:
          shop.shopName,
        title:
          finalTitle,
        description:
          finalDescription,
        tags:
          finalTags,
        state:
          updatedListing.state ??
          null,
        listingUrl:
          updatedListing.url ??
          null,
        updateHistoryId:
          insertedHistory?.id ??
          null,
            
        performanceTrackingStarted,
            
        performanceTrackingError,
        updatedFields: {
          title:
            updateTitle,
          description:
            updateDescription,
          tags:
            updateTags,
        },
      });

    return applyEtsyAuthCookies(
      response,
      authSession,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The Etsy listing could not be updated.";

    console.error(
      "Etsy listing content update failed:",
      error,
    );

    /*
     * Record failed Etsy updates only after the authenticated
     * shop and current listing have been successfully resolved.
     */
    if (historyContext) {
      const {
        error: failedHistoryInsertError,
      } = await supabaseAdmin
        .from(
          "etsy_listing_update_history",
        )
        .insert({
          etsy_user_id:
            historyContext.etsyUserId,

          etsy_shop_id:
            historyContext.shopId,
          etsy_shop_name:
            historyContext.shopName,

          etsy_listing_id:
            historyContext.listingId,
          listing_title:
            historyContext.listingTitle,

          updated_title:
            historyContext.updateTitle,
          updated_description:
            historyContext.updateDescription,
          updated_tags:
            historyContext.updateTags,

          previous_title:
            historyContext.previousTitle,
          new_title:
            historyContext.newTitle,

          previous_description:
            historyContext.previousDescription,
          new_description:
            historyContext.newDescription,

          previous_tags:
            historyContext.previousTags,
          new_tags:
            historyContext.newTags,

          update_status:
            "failed",
          error_message:
            message,
        });

      if (
        failedHistoryInsertError
      ) {
        console.error(
          "Failed Etsy update history insert failed:",
          failedHistoryInsertError,
        );
      }
    }

    const status =
      error instanceof EtsyApiError
        ? error.status
        : message.includes(
              "required",
            ) ||
              message.includes(
                "empty",
              ) ||
              message.includes(
                "Select",
              ) ||
              message.includes(
                "maximum",
              ) ||
              message.includes(
                "valid",
              )
          ? 400
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
          etsyStatus:
            error instanceof EtsyApiError
              ? error.status
              : undefined,
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