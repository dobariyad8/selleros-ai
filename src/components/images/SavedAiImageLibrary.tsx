"use client";

import Link from "next/link";
import {
  ArrowRight,
  Download,
  ImageIcon,
  LoaderCircle,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  deleteSavedAiImage,
  getSavedAiImages,
  type SavedAiImage,
} from "@/lib/images/imageLibrary";

type LibraryImage = SavedAiImage & {
  objectUrl: string;
};

function getDownloadExtension(
  mimeType: string,
) {
  if (mimeType.includes("jpeg")) {
    return "jpg";
  }

  if (mimeType.includes("webp")) {
    return "webp";
  }

  return "png";
}

function createDownloadName(
  image: LibraryImage,
) {
  const safeListingTitle =
    image.listingTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "etsy-listing";

  return `${safeListingTitle}-${image.style}.${getDownloadExtension(
    image.mimeType,
  )}`;
}

export default function SavedAiImageLibrary() {
  const [images, setImages] = useState<
    LibraryImage[]
  >([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [deletingImageId, setDeletingImageId] =
    useState<string | null>(null);

  const [isBulkDeleting, setIsBulkDeleting] =
    useState(false);

  const [error, setError] = useState("");

  const [listingFilter, setListingFilter] =
    useState("all");

  const [styleFilter, setStyleFilter] =
    useState("all");

  const [searchQuery, setSearchQuery] =
    useState("");

  const [
    selectedImageIds,
    setSelectedImageIds,
  ] = useState<string[]>([]);

  const listingOptions = useMemo(() => {
    const listings = new Map<
      string,
      string
    >();

    images.forEach((image) => {
      listings.set(
        image.listingId,
        image.listingTitle,
      );
    });

    return Array.from(
      listings.entries(),
    )
      .map(([id, title]) => ({
        id,
        title,
      }))
      .sort((first, second) =>
        first.title.localeCompare(
          second.title,
        ),
      );
  }, [images]);

  const styleOptions = useMemo(() => {
    const styles = new Map<
      string,
      string
    >();

    images.forEach((image) => {
      styles.set(
        image.style,
        image.styleLabel,
      );
    });

    return Array.from(
      styles.entries(),
    )
      .map(([value, label]) => ({
        value,
        label,
      }))
      .sort((first, second) =>
        first.label.localeCompare(
          second.label,
        ),
      );
  }, [images]);

  const filteredImages = useMemo(() => {
    const normalizedSearch =
      searchQuery.trim().toLowerCase();

    return images.filter((image) => {
      const matchesListing =
        listingFilter === "all" ||
        image.listingId === listingFilter;

      const matchesStyle =
        styleFilter === "all" ||
        image.style === styleFilter;

      const matchesSearch =
        !normalizedSearch ||
        image.listingTitle
          .toLowerCase()
          .includes(normalizedSearch) ||
        image.styleLabel
          .toLowerCase()
          .includes(normalizedSearch) ||
        image.customInstructions
          .toLowerCase()
          .includes(normalizedSearch);

      return (
        matchesListing &&
        matchesStyle &&
        matchesSearch
      );
    });
  }, [
    images,
    listingFilter,
    styleFilter,
    searchQuery,
  ]);

  const selectedImages = useMemo(
    () =>
      images.filter((image) =>
        selectedImageIds.includes(image.id),
      ),
    [images, selectedImageIds],
  );

  const allFilteredImagesSelected =
    filteredImages.length > 0 &&
    filteredImages.every((image) =>
      selectedImageIds.includes(image.id),
    );

  async function loadImages() {
    setIsLoading(true);
    setError("");

    try {
      const savedImages =
        await getSavedAiImages();

      const libraryImages =
        savedImages.map((image) => ({
          ...image,
          objectUrl: URL.createObjectURL(
            image.imageBlob,
          ),
        }));

      setImages((currentImages) => {
        currentImages.forEach((image) => {
          URL.revokeObjectURL(
            image.objectUrl,
          );
        });

        return libraryImages;
      });

      setSelectedImageIds([]);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Saved images could not be loaded.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadImages();

    return () => {
      setImages((currentImages) => {
        currentImages.forEach((image) => {
          URL.revokeObjectURL(
            image.objectUrl,
          );
        });

        return [];
      });
    };
  }, []);

  function downloadImage(
    image: LibraryImage,
  ) {
    const link =
      document.createElement("a");

    link.href = image.objectUrl;
    link.download =
      createDownloadName(image);

    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function toggleImageSelection(
    imageId: string,
  ) {
    setSelectedImageIds((currentIds) =>
      currentIds.includes(imageId)
        ? currentIds.filter(
            (id) => id !== imageId,
          )
        : [...currentIds, imageId],
    );
  }

  function toggleAllFilteredImages() {
    if (allFilteredImagesSelected) {
      const filteredIds = new Set(
        filteredImages.map(
          (image) => image.id,
        ),
      );

      setSelectedImageIds((currentIds) =>
        currentIds.filter(
          (id) => !filteredIds.has(id),
        ),
      );

      return;
    }

    setSelectedImageIds((currentIds) => [
      ...new Set([
        ...currentIds,
        ...filteredImages.map(
          (image) => image.id,
        ),
      ]),
    ]);
  }

  async function downloadSelectedImages() {
    for (
      let index = 0;
      index < selectedImages.length;
      index += 1
    ) {
      downloadImage(selectedImages[index]);

      await new Promise((resolve) =>
        window.setTimeout(resolve, 150),
      );
    }
  }

  async function deleteSelectedImages() {
    if (selectedImages.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${selectedImages.length} selected ${
        selectedImages.length === 1
          ? "image"
          : "images"
      }? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setIsBulkDeleting(true);
    setError("");

    try {
      await Promise.all(
        selectedImages.map((image) =>
          deleteSavedAiImage(image.id),
        ),
      );

      const selectedIds = new Set(
        selectedImages.map(
          (image) => image.id,
        ),
      );

      selectedImages.forEach((image) => {
        URL.revokeObjectURL(
          image.objectUrl,
        );
      });

      setImages((currentImages) =>
        currentImages.filter(
          (image) =>
            !selectedIds.has(image.id),
        ),
      );

      setSelectedImageIds([]);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "The selected images could not be deleted.",
      );
    } finally {
      setIsBulkDeleting(false);
    }
  }

  async function deleteImage(
    image: LibraryImage,
  ) {
    setDeletingImageId(image.id);
    setError("");

    try {
      await deleteSavedAiImage(
        image.id,
      );

      URL.revokeObjectURL(
        image.objectUrl,
      );

      setImages((currentImages) =>
        currentImages.filter(
          (currentImage) =>
            currentImage.id !== image.id,
        ),
      );

      setSelectedImageIds((currentIds) =>
        currentIds.filter(
          (id) => id !== image.id,
        ),
      );
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "The saved image could not be deleted.",
      );
    } finally {
      setDeletingImageId(null);
    }
  }

  return (
    <Card className="mt-4 min-w-0 sm:mt-6">
      <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <ImageIcon className="size-5 shrink-0" />
              Saved AI Images
            </CardTitle>

            <CardDescription className="mt-1">
              AI images saved from listing
              audits on this browser and device.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="shrink-0"
            >
              {filteredImages.length}
              {filteredImages.length !==
              images.length
                ? ` of ${images.length}`
                : ""}{" "}
              {filteredImages.length === 1
                ? "image"
                : "images"}
            </Badge>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={() =>
                void loadImages()
              }
            >
              <RefreshCw
                className={
                  isLoading
                    ? "size-4 animate-spin"
                    : "size-4"
                }
              />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
        {error ? (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </div>
        ) : null}

        {!isLoading &&
        images.length > 0 ? (
          <div className="mb-5 grid min-w-0 grid-cols-1 gap-3 rounded-xl border bg-muted/20 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-3">
            <div className="min-w-0 sm:col-span-2 lg:col-span-1">
              <label
                htmlFor="saved-image-search"
                className="text-sm font-medium"
              >
                Search saved images
              </label>

              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  id="saved-image-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(
                      event.target.value,
                    )
                  }
                  placeholder="Search listing, style, or instructions"
                  className="h-10 w-full min-w-0 rounded-xl border bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30"
                />
              </div>
            </div>

            <div className="min-w-0">
              <label
                htmlFor="saved-image-listing-filter"
                className="text-sm font-medium"
              >
                Filter by listing
              </label>

              <select
                id="saved-image-listing-filter"
                value={listingFilter}
                onChange={(event) =>
                  setListingFilter(
                    event.target.value,
                  )
                }
                className="mt-2 h-10 w-full min-w-0 rounded-xl border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/30"
              >
                <option value="all">
                  All listings
                </option>

                {listingOptions.map(
                  (listing) => (
                    <option
                      key={listing.id}
                      value={listing.id}
                    >
                      {listing.title}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="min-w-0">
              <label
                htmlFor="saved-image-style-filter"
                className="text-sm font-medium"
              >
                Filter by style
              </label>

              <select
                id="saved-image-style-filter"
                value={styleFilter}
                onChange={(event) =>
                  setStyleFilter(
                    event.target.value,
                  )
                }
                className="mt-2 h-10 w-full min-w-0 rounded-xl border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/30"
              >
                <option value="all">
                  All styles
                </option>

                {styleOptions.map(
                  (imageStyle) => (
                    <option
                      key={imageStyle.value}
                      value={imageStyle.value}
                    >
                      {imageStyle.label}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>
        ) : null}

        {!isLoading &&
        filteredImages.length > 0 ? (
          <div className="mb-4 flex min-w-0 flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={
                  allFilteredImagesSelected
                }
                onChange={
                  toggleAllFilteredImages
                }
                className="size-4 rounded border"
              />

              Select all visible
            </label>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span className="text-sm text-muted-foreground">
                {selectedImages.length} selected
              </span>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={
                  selectedImages.length === 0
                }
                onClick={() =>
                  void downloadSelectedImages()
                }
              >
                <Download className="size-4" />
                Download Selected
              </Button>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={
                  selectedImages.length === 0 ||
                  isBulkDeleting
                }
                onClick={() =>
                  void deleteSelectedImages()
                }
              >
                {isBulkDeleting ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}

                Delete Selected
              </Button>
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed">
            <div className="text-center">
              <LoaderCircle className="mx-auto size-6 animate-spin text-muted-foreground" />

              <p className="mt-3 text-sm text-muted-foreground">
                Loading saved images…
              </p>
            </div>
          </div>
        ) : filteredImages.length > 0 ? (
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredImages.map((image) => (
              <article
                key={image.id}
                className={`min-w-0 overflow-hidden rounded-xl border bg-card ${
                  selectedImageIds.includes(
                    image.id,
                  )
                    ? "ring-2 ring-primary/30"
                    : ""
                }`}
              >
                <div className="relative aspect-square bg-muted">
                  <label className="absolute left-3 top-3 z-10 flex cursor-pointer items-center gap-2 rounded-full bg-background/95 px-3 py-1.5 text-xs font-medium shadow-sm">
                    <input
                      type="checkbox"
                      checked={selectedImageIds.includes(
                        image.id,
                      )}
                      onChange={() =>
                        toggleImageSelection(
                          image.id,
                        )
                      }
                      className="size-4 rounded border"
                    />

                    Select
                  </label>

                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.objectUrl}
                    alt={`${image.styleLabel} image for ${image.listingTitle}`}
                    className="size-full object-contain"
                  />
                </div>

                <div className="space-y-3 p-3 sm:p-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        {image.styleLabel}
                      </Badge>

                      <span className="text-xs text-muted-foreground">
                        {new Date(
                          image.createdAt,
                        ).toLocaleString()}
                      </span>
                    </div>

                    <p className="mt-3 line-clamp-2 wrap-break-words font-medium">
                      {image.listingTitle}
                    </p>
                  </div>

                  {image.customInstructions ? (
                    <p className="line-clamp-2 wrap-break-words text-xs leading-5 text-muted-foreground">
                      {
                        image.customInstructions
                      }
                    </p>
                  ) : null}

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        downloadImage(image)
                      }
                    >
                      <Download className="size-4" />
                      Download
                    </Button>

                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={
                        deletingImageId === image.id
                      }
                      onClick={() =>
                        void deleteImage(image)
                      }
                    >
                      {deletingImageId ===
                      image.id ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}

                      Delete
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      nativeButton={false}
                      render={
                        <Link
                          href={`/audit/${image.listingId}`}
                        />
                      }
                    >
                      Open Audit
                      <ArrowRight className="size-4" />
                    </Button>

                    <Button
                      size="sm"
                      nativeButton={false}
                      render={
                        <Link
                          href={`/audit/${image.listingId}?focus=image`}
                        />
                      }
                    >
                      <Sparkles className="size-4" />
                      Create More
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : images.length > 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center sm:p-10">
            <ImageIcon className="mx-auto size-9 text-muted-foreground" />

            <p className="mt-3 font-medium">
              No images match these filters
            </p>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
              Try another search term, listing,
              or image style.
            </p>

            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery("");
                setListingFilter("all");
                setStyleFilter("all");
                setSelectedImageIds([]);
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-center sm:p-10">
            <ImageIcon className="mx-auto size-9 text-muted-foreground" />

            <p className="mt-3 font-medium">
              No saved AI images
            </p>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
              Generate an image from a listing
              audit and select Save to add it to
              this library.
            </p>
          </div>
        )}

        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          Saved images are stored locally in this
          browser. They will not automatically
          appear on another device or browser.
        </p>
      </CardContent>
    </Card>
  );
}