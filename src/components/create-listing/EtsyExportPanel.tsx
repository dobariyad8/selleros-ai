"use client";

import {
  ExternalLink,
  LoaderCircle,
  RefreshCw,
  Send,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type EtsyShippingProfile = {
  shipping_profile_id: number;
  title: string;
  origin_country_iso?: string;
  min_processing_days?: number;
  max_processing_days?: number;
};

type EtsyReadinessState = {
  shop_id: number;
  readiness_state_id: number;
  readiness_state:
    | "ready_to_ship"
    | "made_to_order";
  min_processing_days?: number;
  max_processing_days?: number;
  processing_days_display_label?: string;
};

type EtsyTaxonomyNode = {
  id: number;
  level: number;
  name: string;
  parent_id: number | null;
  full_path_taxonomy_ids?: number[];
  children?: EtsyTaxonomyNode[];
};

type EtsyListingOptionsResponse = {
  success: boolean;
  shop?: {
    shopId: number;
    shopName: string;
  };
  shippingProfiles?: EtsyShippingProfile[];
  readinessStates?: EtsyReadinessState[];
  taxonomy?: EtsyTaxonomyNode[];
  error?: string;
};

type EtsyExportResponse = {
  success: boolean;
  projectId?: string;
  shopId?: number;
  shopName?: string;
  listingId?: number;
  listingUrl?: string | null;
  uploadedImageCount?: number;
  state?: string;
  error?: string;
};

type FlattenedTaxonomyNode = {
  id: number;
  name: string;
  path: string;
  level: number;
  hasChildren: boolean;
};

type EtsyExportPanelProps = {
  projectId: string | null;
  existingListingId?: number | null;
  existingListingUrl?: string | null;
};

const inputClassName =
  "mt-2 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/30";

function flattenTaxonomy(
  nodes: EtsyTaxonomyNode[],
  parentNames: string[] = [],
): FlattenedTaxonomyNode[] {
  return nodes.flatMap((node) => {
    const currentNames = [
      ...parentNames,
      node.name,
    ];

    const children = Array.isArray(
      node.children,
    )
      ? node.children
      : [];

    return [
      {
        id: node.id,
        name: node.name,
        path: currentNames.join(" → "),
        level: node.level,
        hasChildren:
          children.length > 0,
      },
      ...flattenTaxonomy(
        children,
        currentNames,
      ),
    ];
  });
}

function formatProcessingRange(
  minimum?: number,
  maximum?: number,
) {
  if (
    typeof minimum !== "number" &&
    typeof maximum !== "number"
  ) {
    return "";
  }

  if (
    typeof minimum === "number" &&
    typeof maximum === "number"
  ) {
    if (minimum === maximum) {
      return `${minimum} processing day${
        minimum === 1 ? "" : "s"
      }`;
    }

    return `${minimum}–${maximum} processing days`;
  }

  const days =
    minimum ?? maximum ?? 0;

  return `${days} processing day${
    days === 1 ? "" : "s"
  }`;
}

export default function EtsyExportPanel({
  projectId,
  existingListingId = null,
  existingListingUrl = null,
}: EtsyExportPanelProps) {
  const [
    shippingProfiles,
    setShippingProfiles,
  ] = useState<EtsyShippingProfile[]>([]);

  const [
    readinessStates,
    setReadinessStates,
  ] = useState<EtsyReadinessState[]>([]);

  const [taxonomy, setTaxonomy] =
    useState<EtsyTaxonomyNode[]>([]);

  const [shopName, setShopName] =
    useState("");

  const [
    taxonomySearch,
    setTaxonomySearch,
  ] = useState("");

  const [
    selectedTaxonomyId,
    setSelectedTaxonomyId,
  ] = useState("");

  const [
    selectedShippingProfileId,
    setSelectedShippingProfileId,
  ] = useState("");

  const [
    selectedReadinessStateId,
    setSelectedReadinessStateId,
  ] = useState("");

  const [itemWeight, setItemWeight] =
    useState("");
  
  const [itemWeightUnit, setItemWeightUnit] =
    useState("oz");
  
  const [itemLength, setItemLength] =
    useState("");
  
  const [itemWidth, setItemWidth] =
    useState("");
  
  const [itemHeight, setItemHeight] =
    useState("");
  
  const [
    itemDimensionsUnit,
    setItemDimensionsUnit,
  ] = useState("in");

  const [whoMade, setWhoMade] =
    useState("i_did");

  const [whenMade, setWhenMade] =
    useState("2020_2026");

  const [isSupply, setIsSupply] =
    useState(false);

  const [
    shouldAutoRenew,
    setShouldAutoRenew,
  ] = useState(false);

  const [
    isLoadingOptions,
    setIsLoadingOptions,
  ] = useState(false);

  const [isExporting, setIsExporting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [
    exportedListingId,
    setExportedListingId,
  ] = useState<number | null>(
    existingListingId,
  );

  const [
    exportedListingUrl,
    setExportedListingUrl,
  ] = useState<string | null>(
    existingListingUrl,
  );

  const flattenedTaxonomy =
    useMemo(
      () =>
        flattenTaxonomy(taxonomy),
      [taxonomy],
    );

  const filteredTaxonomy =
    useMemo(() => {
      const search =
        taxonomySearch
          .trim()
          .toLowerCase();

      const selectableNodes =
        flattenedTaxonomy.filter(
          (node) =>
            !node.hasChildren,
        );

      if (!search) {
        return selectableNodes.slice(
          0,
          150,
        );
      }

      return selectableNodes
        .filter((node) =>
          node.path
            .toLowerCase()
            .includes(search),
        )
        .slice(0, 150);
    }, [
      flattenedTaxonomy,
      taxonomySearch,
    ]);

  async function loadOptions() {
    setIsLoadingOptions(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        "/api/etsy/listing-options",
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data =
        (await response.json()) as EtsyListingOptionsResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Etsy listing options could not be loaded.",
        );
      }

      const loadedShippingProfiles =
        data.shippingProfiles ?? [];

      const loadedReadinessStates =
        data.readinessStates ?? [];

      setShopName(
        data.shop?.shopName ?? "",
      );

      setShippingProfiles(
        loadedShippingProfiles,
      );

      setReadinessStates(
        loadedReadinessStates,
      );

      setTaxonomy(
        data.taxonomy ?? [],
      );

      setSelectedShippingProfileId(
        (currentValue) =>
          currentValue ||
          (loadedShippingProfiles[0]
            ? String(
                loadedShippingProfiles[0]
                  .shipping_profile_id,
              )
            : ""),
      );

      setSelectedReadinessStateId(
        (currentValue) =>
          currentValue ||
          (loadedReadinessStates[0]
            ? String(
                loadedReadinessStates[0]
                  .readiness_state_id,
              )
            : ""),
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Etsy listing options could not be loaded.",
      );
    } finally {
      setIsLoadingOptions(false);
    }
  }

  useEffect(() => {
    if (
      !projectId ||
      exportedListingId
    ) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadOptions();
    // Options should load once when a project becomes available.
  }, [projectId, exportedListingId]);

  async function exportToEtsy() {
    setError("");
    setMessage("");

    if (!projectId) {
      setError(
        "Save the listing project before exporting it.",
      );

      return;
    }

    if (!selectedTaxonomyId) {
      setError(
        "Select an Etsy category.",
      );

      return;
    }

    if (!selectedShippingProfileId) {
      setError(
        "Select an Etsy shipping profile.",
      );

      return;
    }

    const numericItemWeight =
      Number(itemWeight);

    const numericItemLength =
      Number(itemLength);

    const numericItemWidth =
      Number(itemWidth);

    const numericItemHeight =
      Number(itemHeight);

    if (
      !Number.isFinite(
        numericItemWeight,
      ) ||
      numericItemWeight <= 0
    ) {
      setError(
        "Enter a valid packaged item weight.",
      );

      return;
    }

    if (
      !Number.isFinite(
        numericItemLength,
      ) ||
      numericItemLength <= 0
    ) {
      setError(
        "Enter a valid package length.",
      );

      return;
    }

    if (
      !Number.isFinite(
        numericItemWidth,
      ) ||
      numericItemWidth <= 0
    ) {
      setError(
        "Enter a valid package width.",
      );

      return;
    }

    if (
      !Number.isFinite(
        numericItemHeight,
      ) ||
      numericItemHeight <= 0
    ) {
      setError(
        "Enter a valid package height.",
      );

      return;
    }

    if (!selectedReadinessStateId) {
      setError(
        "Select an Etsy processing profile.",
      );

      return;
    }

    setIsExporting(true);

    try {
      const response = await fetch(
        "/api/etsy/export-listing",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            projectId,
            taxonomyId:
              Number(
                selectedTaxonomyId,
              ),
            shippingProfileId:
              Number(
                selectedShippingProfileId,
              ),
            readinessStateId:
              Number(
                selectedReadinessStateId,
              ),
              itemWeight:
                numericItemWeight,
              itemWeightUnit,
              itemLength:
                numericItemLength,
              itemWidth:
                numericItemWidth,
              itemHeight:
                numericItemHeight,
              itemDimensionsUnit,
            whoMade,
            whenMade,
            isSupply,
            shouldAutoRenew,
          }),
        },
      );

      const data =
        (await response.json()) as EtsyExportResponse;

      if (
        !response.ok ||
        !data.success ||
        !data.listingId
      ) {
        throw new Error(
          data.error ||
            "The Etsy draft could not be created.",
        );
      }

      setExportedListingId(
        data.listingId,
      );

      setExportedListingUrl(
        data.listingUrl ?? null,
      );

      setMessage(
        `Etsy draft ${data.listingId} was created with ${
          data.uploadedImageCount ?? 0
        } images.`,
      );
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : "The Etsy draft could not be created.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  if (exportedListingId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            Etsy draft created
          </CardTitle>

          <CardDescription>
            This SellerOS project has already
            been exported to Etsy.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-sm font-medium">
              Etsy listing ID
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {exportedListingId}
            </p>
          </div>

          <div className="space-y-2">
            <a
              href="https://www.etsy.com/your/shops/me/tools/listings?ref=seller-platform-mcnav&state=draft&sort=update_date"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <ExternalLink className="size-4" />
              Open Etsy drafts
            </a>
              
            <p className="text-xs text-muted-foreground">
              In Etsy Shop Manager, open Listings and select
              Drafts. Look for listing ID{" "}
              <span className="font-medium text-foreground">
                {exportedListingId}
              </span>{" "}
              in your draft listings.
            </p>
          </div>

          {message ? (
            <div
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
            >
              {message}
            </div>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Export to Etsy
        </CardTitle>

        <CardDescription>
          Create an unpublished Etsy draft and
          upload all completed generated listing
          images. Review the draft in Etsy before
          publishing it.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {shopName ? (
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-sm font-medium">
              Connected shop
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {shopName}
            </p>
          </div>
        ) : null}

        {isLoadingOptions ? (
          <div
            role="status"
            className="flex items-center gap-3 rounded-xl border p-4 text-sm text-muted-foreground"
          >
            <LoaderCircle className="size-4 animate-spin" />
            Loading Etsy categories and shop
            profiles…
          </div>
        ) : null}

        {!isLoadingOptions ? (
          <>
            <div>
              <label
                htmlFor="etsy-category-search"
                className="text-sm font-medium"
              >
                Search Etsy category
              </label>

              <input
                id="etsy-category-search"
                type="search"
                value={taxonomySearch}
                placeholder="Example: Rakhi, bracelet, earrings"
                className={inputClassName}
                onChange={(event) => {
                  setTaxonomySearch(
                    event.target.value,
                  );

                  setSelectedTaxonomyId(
                    "",
                  );
                }}
              />

              <p className="mt-1 text-xs text-muted-foreground">
                Enter a product category, then
                choose the closest matching Etsy
                category below.
              </p>
            </div>

            <div>
              <label
                htmlFor="etsy-taxonomy"
                className="text-sm font-medium"
              >
                Etsy category
              </label>

              <select
                id="etsy-taxonomy"
                value={selectedTaxonomyId}
                className={inputClassName}
                onChange={(event) =>
                  setSelectedTaxonomyId(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  Select a category
                </option>

                {filteredTaxonomy.map(
                  (node) => (
                    <option
                      key={node.id}
                      value={node.id}
                    >
                      {node.path}
                    </option>
                  ),
                )}
              </select>

              {taxonomySearch &&
              filteredTaxonomy.length ===
                0 ? (
                <p className="mt-2 text-sm text-destructive">
                  No matching leaf categories
                  were found. Try a broader
                  search.
                </p>
              ) : null}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="etsy-shipping-profile"
                  className="text-sm font-medium"
                >
                  Shipping profile
                </label>

                <select
                  id="etsy-shipping-profile"
                  value={
                    selectedShippingProfileId
                  }
                  className={inputClassName}
                  onChange={(event) =>
                    setSelectedShippingProfileId(
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    Select a shipping profile
                  </option>

                  {shippingProfiles.map(
                    (profile) => (
                      <option
                        key={
                          profile.shipping_profile_id
                        }
                        value={
                          profile.shipping_profile_id
                        }
                      >
                        {profile.title}
                        {profile.origin_country_iso
                          ? ` · ${profile.origin_country_iso}`
                          : ""}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <label
                  htmlFor="etsy-readiness-state"
                  className="text-sm font-medium"
                >
                  Processing profile
                </label>

                <select
                  id="etsy-readiness-state"
                  value={
                    selectedReadinessStateId
                  }
                  className={inputClassName}
                  onChange={(event) =>
                    setSelectedReadinessStateId(
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    Select a processing profile
                  </option>

                  {readinessStates.map(
                    (state) => {
                      const label =
                        state.processing_days_display_label ||
                        formatProcessingRange(
                          state.min_processing_days,
                          state.max_processing_days,
                        ) ||
                        state.readiness_state.replaceAll(
                          "_",
                          " ",
                        );

                      return (
                        <option
                          key={
                            state.readiness_state_id
                          }
                          value={
                            state.readiness_state_id
                          }
                        >
                          {label}
                        </option>
                      );
                    },
                  )}
                </select>
              </div>

              <div>
                <label
                  htmlFor="etsy-who-made"
                  className="text-sm font-medium"
                >
                  Who made it?
                </label>

                <select
                  id="etsy-who-made"
                  value={whoMade}
                  className={inputClassName}
                  onChange={(event) =>
                    setWhoMade(
                      event.target.value,
                    )
                  }
                >
                  <option value="i_did">
                    I did
                  </option>

                  <option value="collective">
                    A member of my shop
                  </option>

                  <option value="someone_else">
                    Another company or person
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="etsy-when-made"
                  className="text-sm font-medium"
                >
                  When was it made?
                </label>

                <select
                  id="etsy-when-made"
                  value={whenMade}
                  className={inputClassName}
                  onChange={(event) =>
                    setWhenMade(
                      event.target.value,
                    )
                  }
                >
                  <option value="made_to_order">
                    Made to order
                  </option>

                  <option value="2020_2026">
                    2020–2026
                  </option>

                  <option value="2010_2019">
                    2010–2019
                  </option>

                  <option value="2007_2009">
                    2007–2009
                  </option>

                  <option value="before_2007">
                    Before 2007
                  </option>
                </select>
              </div>
              <div className="space-y-4 rounded-xl border p-4">
                  <div>
                    <p className="text-sm font-medium">
                      Packaged item measurements
                    </p>
                            
                    <p className="mt-1 text-xs text-muted-foreground">
                      Enter the weight and outside package
                      dimensions used to calculate shipping.
                    </p>
                  </div>
                            
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="etsy-item-weight"
                        className="text-sm font-medium"
                      >
                        Packaged weight
                      </label>
                            
                      <div className="grid grid-cols-[1fr_100px] gap-2">
                        <input
                          id="etsy-item-weight"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={itemWeight}
                          placeholder="Example: 4"
                          className={inputClassName}
                          onChange={(event) =>
                            setItemWeight(
                              event.target.value,
                            )
                          }
                        />
                
                        <select
                          aria-label="Weight unit"
                          value={itemWeightUnit}
                          className={inputClassName}
                          onChange={(event) =>
                            setItemWeightUnit(
                              event.target.value,
                            )
                          }
                        >
                          <option value="oz">
                            oz
                          </option>
                      
                          <option value="lb">
                            lb
                          </option>
                      
                          <option value="g">
                            g
                          </option>
                      
                          <option value="kg">
                            kg
                          </option>
                        </select>
                      </div>
                    </div>
                      
                    <div>
                      <label
                        htmlFor="etsy-dimensions-unit"
                        className="text-sm font-medium"
                      >
                        Dimension unit
                      </label>
                      
                      <select
                        id="etsy-dimensions-unit"
                        value={itemDimensionsUnit}
                        className={inputClassName}
                        onChange={(event) =>
                          setItemDimensionsUnit(
                            event.target.value,
                          )
                        }
                      >
                        <option value="in">
                          Inches
                        </option>
                    
                        <option value="ft">
                          Feet
                        </option>
                    
                        <option value="mm">
                          Millimeters
                        </option>
                    
                        <option value="cm">
                          Centimeters
                        </option>
                    
                        <option value="m">
                          Meters
                        </option>
                    
                        <option value="yd">
                          Yards
                        </option>
                      </select>
                    </div>
                  </div>
                    
                  <div className="grid gap-5 sm:grid-cols-3">
                    <div>
                      <label
                        htmlFor="etsy-item-length"
                        className="text-sm font-medium"
                      >
                        Package length
                      </label>
                    
                      <input
                        id="etsy-item-length"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={itemLength}
                        placeholder="Length"
                        className={inputClassName}
                        onChange={(event) =>
                          setItemLength(
                            event.target.value,
                          )
                        }
                      />
                    </div>
                    
                    <div>
                      <label
                        htmlFor="etsy-item-width"
                        className="text-sm font-medium"
                      >
                        Package width
                      </label>
                    
                      <input
                        id="etsy-item-width"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={itemWidth}
                        placeholder="Width"
                        className={inputClassName}
                        onChange={(event) =>
                          setItemWidth(
                            event.target.value,
                          )
                        }
                      />
                    </div>
                    
                    <div>
                      <label
                        htmlFor="etsy-item-height"
                        className="text-sm font-medium"
                      >
                        Package height
                      </label>
                    
                      <input
                        id="etsy-item-height"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={itemHeight}
                        placeholder="Height"
                        className={inputClassName}
                        onChange={(event) =>
                          setItemHeight(
                            event.target.value,
                          )
                        }
                      />
                    </div>
                  </div>
                    
                  <p className="text-xs text-muted-foreground">
                    Measure the final shipping package, not
                    only the product itself.
                  </p>
                </div>
            </div>

            <div className="space-y-3 rounded-xl border p-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isSupply}
                  className="mt-1 size-4"
                  onChange={(event) =>
                    setIsSupply(
                      event.target.checked,
                    )
                  }
                />

                <span>
                  <span className="block text-sm font-medium">
                    This product is a craft supply
                  </span>

                  <span className="mt-1 block text-xs text-muted-foreground">
                    Leave this unchecked for a
                    finished handmade product.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={shouldAutoRenew}
                  className="mt-1 size-4"
                  onChange={(event) =>
                    setShouldAutoRenew(
                      event.target.checked,
                    )
                  }
                />

                <span>
                  <span className="block text-sm font-medium">
                    Automatically renew this
                    listing
                  </span>

                  <span className="mt-1 block text-xs text-muted-foreground">
                    Etsy renewal fees may apply
                    when the listing renews.
                  </span>
                </span>
              </label>
            </div>
          </>
        ) : null}

        {shippingProfiles.length === 0 &&
        !isLoadingOptions ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            No Etsy shipping profiles were
            returned. Create a shipping profile
            in Etsy Shop Manager, then reload
            these options.
          </div>
        ) : null}

        {readinessStates.length === 0 &&
        !isLoadingOptions ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            No Etsy processing profiles were
            returned. Create or update a
            processing profile in Etsy Shop
            Manager, then reload these options.
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
          >
            {error}
          </div>
        ) : null}

        {message ? (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            {message}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={
              isLoadingOptions ||
              isExporting
            }
            onClick={() =>
              void loadOptions()
            }
          >
            {isLoadingOptions ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Reload Etsy options
          </Button>

          <Button
            type="button"
            disabled={
              !projectId ||
              isLoadingOptions ||
              isExporting ||
              !selectedTaxonomyId ||
              !selectedShippingProfileId ||
              !selectedReadinessStateId ||
              !itemWeight ||
              !itemLength ||
              !itemWidth ||
              !itemHeight
            }
            onClick={() =>
              void exportToEtsy()
            }
          >
            {isExporting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Creating Etsy draft…
              </>
            ) : (
              <>
                <Send className="size-4" />
                Create Etsy draft
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Save your latest listing edits and
          generate at least one image before
          creating the Etsy draft.
        </p>
      </CardContent>
    </Card>
  );
}