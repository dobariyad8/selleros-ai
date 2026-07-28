"use client";

import {
  Download,
  ImageIcon,
  LoaderCircle,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

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

  const [error, setError] = useState("");

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

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="shrink-0"
            >
              {images.length}{" "}
              {images.length === 1
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

        {isLoading ? (
          <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed">
            <div className="text-center">
              <LoaderCircle className="mx-auto size-6 animate-spin text-muted-foreground" />

              <p className="mt-3 text-sm text-muted-foreground">
                Loading saved images…
              </p>
            </div>
          </div>
        ) : images.length > 0 ? (
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {images.map((image) => (
              <article
                key={image.id}
                className="min-w-0 overflow-hidden rounded-xl border bg-card"
              >
                <div className="aspect-square bg-muted">
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
                        deletingImageId ===
                        image.id
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
                  </div>
                </div>
              </article>
            ))}
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