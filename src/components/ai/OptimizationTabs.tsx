"use client";

import {
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  UploadCloud,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

import AIOptimizeListingCard from "@/components/ai/AIOptimizeListingCard";
import AIRewriteCard from "@/components/ai/AIRewriteCard";
import AIDescriptionRewriteCard from "@/components/ai/AIDescriptionReWriteCard";
import AITagGeneratorCard from "@/components/ai/AITagGeneratorCard";
import CompleteOptimizationCard from "@/components/ai/CompleteOptimizationCard";
import AIImageGeneratorCard from "@/components/ai/AIImageGeneratorCard";

import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import type { SellerOsListing } from "@/lib/etsy/types";

type OptimizedListing = {
  title: string;
  description: string;
  tags: string[];
};

type UpdateEtsyListingResponse = {
  success: boolean;
  listingId?: number;
  shopId?: number;
  shopName?: string;
  title?: string | null;
  description?: string | null;
  tags?: string[] | null;
  state?: string | null;
  listingUrl?: string | null;
  updatedFields?: {
    title: boolean;
    description: boolean;
    tags: boolean;
  };
  error?: string;
};

type Props = {
  listing: SellerOsListing;
  focus: string | null;

  suggestedTitle: string;
  setSuggestedTitle: (
    value: string,
  ) => void;

  suggestedDescription: string;
  setSuggestedDescription: (
    value: string,
  ) => void;

  suggestedTags: string[];
  setSuggestedTags: (
    value: string[],
  ) => void;

  optimizationVersion: number;

  onOptimizationComplete: (
    listing: OptimizedListing,
  ) => void;
};

export default function OptimizationTabs({
  listing,
  focus,
  suggestedTitle,
  setSuggestedTitle,
  suggestedDescription,
  setSuggestedDescription,
  suggestedTags,
  setSuggestedTags,
  optimizationVersion,
  onOptimizationComplete,
}: Props) {
  const [activeTab, setActiveTab] =
    useState("full");

  const [
    isConfirmingEtsyUpdate,
    setIsConfirmingEtsyUpdate,
  ] = useState(false);

  const [
    updateTitle,
    setUpdateTitle,
  ] = useState(false);

  const [
    updateDescription,
    setUpdateDescription,
  ] = useState(false);

  const [
    updateTags,
    setUpdateTags,
  ] = useState(false);

  const [
    isUpdatingEtsy,
    setIsUpdatingEtsy,
  ] = useState(false);

  const [
    etsyUpdateError,
    setEtsyUpdateError,
  ] = useState("");

  const [
    etsyUpdateSuccess,
    setEtsyUpdateSuccess,
  ] = useState("");

  useEffect(() => {
    if (
      focus === "title" ||
      focus === "description" ||
      focus === "tags" ||
      focus === "image"
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(focus);
    }
  }, [focus]);

  const hasSuggestedTitle =
    suggestedTitle.trim().length > 0;

  const hasSuggestedDescription =
    suggestedDescription.trim().length >
    0;

  const hasSuggestedTags =
    suggestedTags.some(
      (tag) =>
        tag.trim().length > 0,
    );

  const hasRecommendations =
    hasSuggestedTitle ||
    hasSuggestedDescription ||
    hasSuggestedTags;

  const hasSelectedFields =
    updateTitle ||
    updateDescription ||
    updateTags;

  function openEtsyUpdateConfirmation() {
    setUpdateTitle(
      hasSuggestedTitle,
    );

    setUpdateDescription(
      hasSuggestedDescription,
    );

    setUpdateTags(
      hasSuggestedTags,
    );

    setEtsyUpdateError("");
    setEtsyUpdateSuccess("");

    setIsConfirmingEtsyUpdate(
      true,
    );
  }

  function cancelEtsyUpdate() {
    if (isUpdatingEtsy) {
      return;
    }

    setIsConfirmingEtsyUpdate(
      false,
    );

    setEtsyUpdateError("");
  }

  async function updateListingOnEtsy() {
    if (!hasSelectedFields) {
      setEtsyUpdateError(
        "Select at least one field to update.",
      );

      return;
    }

    setIsUpdatingEtsy(true);
    setEtsyUpdateError("");
    setEtsyUpdateSuccess("");

    try {
      const response = await fetch(
        "/api/etsy/update-listing-content",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            listingId:
              listing.id,

            updateTitle,
            updateDescription,
            updateTags,

            title:
              suggestedTitle,
            description:
              suggestedDescription,
            tags:
              suggestedTags,
          }),
        },
      );

      const data =
        (await response.json()) as UpdateEtsyListingResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "The Etsy listing could not be updated.",
        );
      }

      const updatedFieldNames: string[] =
        [];

      if (
        data.updatedFields?.title
      ) {
        updatedFieldNames.push(
          "title",
        );
      }

      if (
        data.updatedFields
          ?.description
      ) {
        updatedFieldNames.push(
          "description",
        );
      }

      if (
        data.updatedFields?.tags
      ) {
        updatedFieldNames.push(
          "tags",
        );
      }

      const fieldSummary =
        updatedFieldNames.length > 0
          ? updatedFieldNames.join(
              ", ",
            )
          : "selected content";

      setEtsyUpdateSuccess(
        `Etsy listing ${listing.id} was updated successfully. Updated: ${fieldSummary}.`,
      );

      setIsConfirmingEtsyUpdate(
        false,
      );
    } catch (updateError) {
      setEtsyUpdateError(
        updateError instanceof Error
          ? updateError.message
          : "The Etsy listing could not be updated.",
      );
    } finally {
      setIsUpdatingEtsy(false);
    }
  }

  return (
    <div className="min-w-0 space-y-5">
      <div className="min-w-0 rounded-xl border bg-card p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold">
          AI Optimization Center
        </h2>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList>
            <TabsTrigger value="full">
              Full Optimize
            </TabsTrigger>

            <TabsTrigger value="title">
              Title
            </TabsTrigger>

            <TabsTrigger value="description">
              Description
            </TabsTrigger>

            <TabsTrigger value="tags">
              Tags
            </TabsTrigger>

            <TabsTrigger value="image">
              Image
            </TabsTrigger>
          </TabsList>

          <div className="mt-5">
            <TabsContent value="full">
              <AIOptimizeListingCard
                currentTitle={
                  listing.title
                }
                currentDescription={
                  listing.description ??
                  ""
                }
                currentTags={
                  listing.tags ?? []
                }
                onOptimizationComplete={
                  onOptimizationComplete
                }
              />

              <div className="mt-5">
                <CompleteOptimizationCard
                  currentTitle={
                    listing.title
                  }
                  currentDescription={
                    listing.description ??
                    ""
                  }
                  currentTags={
                    listing.tags ?? []
                  }
                  suggestedTitle={
                    suggestedTitle
                  }
                  suggestedDescription={
                    suggestedDescription
                  }
                  suggestedTags={
                    suggestedTags
                  }
                />
              </div>
            </TabsContent>

            <TabsContent value="title">
              <AIRewriteCard
                key={`title-${optimizationVersion}`}
                current={
                  listing.title
                }
                suggested={
                  suggestedTitle
                }
                onSuggestionChange={
                  setSuggestedTitle
                }
              />
            </TabsContent>

            <TabsContent value="description">
              <AIDescriptionRewriteCard
                key={`description-${optimizationVersion}`}
                title={
                  listing.title
                }
                current={
                  listing.description ??
                  ""
                }
                suggested={
                  suggestedDescription
                }
                onSuggestionChange={
                  setSuggestedDescription
                }
              />
            </TabsContent>

            <TabsContent value="tags">
              <AITagGeneratorCard
                key={`tags-${optimizationVersion}`}
                title={
                  listing.title
                }
                description={
                  listing.description ??
                  ""
                }
                currentTags={
                  listing.tags ?? []
                }
                suggested={
                  suggestedTags
                }
                onSuggestionChange={
                  setSuggestedTags
                }
              />
            </TabsContent>

            <TabsContent value="image">
              <AIImageGeneratorCard
                listing={listing}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {etsyUpdateSuccess ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />

          <div>
            <p className="font-medium">
              Etsy listing updated
            </p>

            <p className="mt-1">
              {etsyUpdateSuccess}
            </p>
          </div>
        </div>
      ) : null}

      {hasRecommendations ? (
        <div className="rounded-xl border bg-card p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">
                Update existing Etsy
                listing
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Review your recommendations
                before manually applying them to
                Etsy listing {listing.id}.
              </p>
            </div>

            {!isConfirmingEtsyUpdate ? (
              <Button
                type="button"
                className="w-full shrink-0 sm:w-auto"
                onClick={
                  openEtsyUpdateConfirmation
                }
              >
                <UploadCloud className="size-4" />
                Update on Etsy
              </Button>
            ) : null}
          </div>

          {isConfirmingEtsyUpdate ? (
            <div className="mt-5 space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3 text-amber-900">
                <AlertTriangle className="mt-0.5 size-5 shrink-0" />

                <div>
                  <p className="font-medium">
                    Confirm Etsy update
                  </p>

                  <p className="mt-1 text-sm">
                    Selected fields will overwrite
                    the current content on Etsy.
                    Unselected fields will remain
                    unchanged.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-white p-3">
                  <input
                    type="checkbox"
                    checked={
                      updateTitle
                    }
                    disabled={
                      !hasSuggestedTitle ||
                      isUpdatingEtsy
                    }
                    onChange={(event) =>
                      setUpdateTitle(
                        event.target
                          .checked,
                      )
                    }
                    className="mt-1 size-4"
                  />

                  <span className="min-w-0">
                    <span className="block text-sm font-medium">
                      Update title
                    </span>

                    <span className="mt-1 block wrap-break-word text-xs text-muted-foreground">
                      {hasSuggestedTitle
                        ? suggestedTitle
                        : "No recommended title has been generated."}
                    </span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-white p-3">
                  <input
                    type="checkbox"
                    checked={
                      updateDescription
                    }
                    disabled={
                      !hasSuggestedDescription ||
                      isUpdatingEtsy
                    }
                    onChange={(event) =>
                      setUpdateDescription(
                        event.target
                          .checked,
                      )
                    }
                    className="mt-1 size-4"
                  />

                  <span className="min-w-0">
                    <span className="block text-sm font-medium">
                      Update description
                    </span>

                    <span className="mt-1 block text-xs text-muted-foreground">
                      {hasSuggestedDescription
                        ? `${suggestedDescription.length} characters`
                        : "No recommended description has been generated."}
                    </span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-white p-3">
                  <input
                    type="checkbox"
                    checked={
                      updateTags
                    }
                    disabled={
                      !hasSuggestedTags ||
                      isUpdatingEtsy
                    }
                    onChange={(event) =>
                      setUpdateTags(
                        event.target
                          .checked,
                      )
                    }
                    className="mt-1 size-4"
                  />

                  <span className="min-w-0">
                    <span className="block text-sm font-medium">
                      Update tags
                    </span>

                    <span className="mt-1 block text-xs text-muted-foreground">
                      {hasSuggestedTags
                        ? `${suggestedTags.filter(
                            (tag) =>
                              tag.trim()
                                .length >
                              0,
                          ).length} recommended tags`
                        : "No recommended tags have been generated."}
                    </span>
                  </span>
                </label>
              </div>

              {etsyUpdateError ? (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                >
                  {etsyUpdateError}
                </div>
              ) : null}

              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    isUpdatingEtsy
                  }
                  onClick={
                    cancelEtsyUpdate
                  }
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  disabled={
                    isUpdatingEtsy ||
                    !hasSelectedFields
                  }
                  onClick={() =>
                    void updateListingOnEtsy()
                  }
                >
                  {isUpdatingEtsy ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      Updating Etsy…
                    </>
                  ) : (
                    <>
                      <UploadCloud className="size-4" />
                      Confirm Etsy update
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}