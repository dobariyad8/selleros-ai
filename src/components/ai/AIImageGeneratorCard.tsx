"use client";

import {
  Download,
  ImageIcon,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  Save,
  Sparkles,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import type { EtsyImageStyle } from "@/lib/ai/prompts";
import type { SellerOsListing } from "@/lib/etsy/types";
import {
  dataUrlToBlob,
  saveAiImage,
} from "@/lib/images/imageLibrary";
import { useSubscription } from "@/hooks/useSubscription";

type Props = {
  listing: SellerOsListing;
};

type ImageUsage = {
  used: number;
  limit: number;
  remaining: number;
  billingMonth: string;
};

type GenerateImageResponse = {
  success: boolean;
  generatedImage?: {
    imageBase64: string;
    mimeType: string;
  };
  usage?: ImageUsage;
  error?: string;
};

type ImageUsageResponse = {
  success: boolean;
  usage?: ImageUsage;
  error?: string;
};

type GeneratedImageHistoryItem = {
  id: string;
  imageUrl: string;
  mimeType: string;
  style: EtsyImageStyle;
  styleLabel: string;
  customInstructions: string;
  sourceImageUrl: string;
  createdAt: string;
};

const imageStyles: {
  value: EtsyImageStyle;
  label: string;
  description: string;
}[] = [
  {
    value: "studio",
    label: "Studio hero",
    description:
      "Clean background with professional product lighting.",
  },
  {
    value: "lifestyle",
    label: "Lifestyle",
    description:
      "A realistic scene showing how the product may be presented or used.",
  },
  {
    value: "gift",
    label: "Gift presentation",
    description:
      "A tasteful gifting scene without implying extra items are included.",
  },
  {
    value: "seasonal",
    label: "Seasonal",
    description:
      "Subtle seasonal styling around the real product.",
  },
  {
    value: "thumbnail",
    label: "Listing thumbnail",
    description:
      "A clean square image designed to remain clear at a small size.",
  },
];

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

export default function AIImageGeneratorCard({
  listing,
}: Props) {
  const {
    hasProAccess,
    isLoading: isSubscriptionLoading,
  } = useSubscription();

  const usableImages = useMemo(
    () =>
      [
        ...new Set(
          listing.imageUrls
            .map((url) => url.trim())
            .filter(Boolean),
        ),
      ],
    [listing.imageUrls],
  );

  const [selectedImageUrl, setSelectedImageUrl] =
    useState(usableImages[0] ?? "");

  const [style, setStyle] =
    useState<EtsyImageStyle>("studio");

  const [
    customInstructions,
    setCustomInstructions,
  ] = useState("");

  const [generatedImageUrl, setGeneratedImageUrl] =
    useState("");

  const [
    generatedMimeType,
    setGeneratedMimeType,
  ] = useState("image/png");

  const [generatedImages, setGeneratedImages] =
    useState<GeneratedImageHistoryItem[]>([]);

  const [savedImageIds, setSavedImageIds] =
    useState<string[]>([]);

  const [savingImageId, setSavingImageId] =
    useState<string | null>(null);

  const [libraryMessage, setLibraryMessage] =
    useState("");

  const [isGenerating, setIsGenerating] =
    useState(false);

  const [imageUsage, setImageUsage] =
    useState<ImageUsage | null>(null);

  const [isLoadingUsage, setIsLoadingUsage] =
    useState(true);

  const [usageError, setUsageError] =
    useState("");

  const [error, setError] = useState("");

  const selectedStyle =
    imageStyles.find(
      (imageStyle) => imageStyle.value === style,
    ) ?? imageStyles[0];

  const hasNoCredits =
    imageUsage !== null &&
    imageUsage.remaining <= 0;

  const usagePercentage =
    imageUsage && imageUsage.limit > 0
      ? Math.min(
          Math.round(
            (imageUsage.used /
              imageUsage.limit) *
              100,
          ),
          100,
        )
      : 0;

  async function loadImageUsage() {
    if (
      isSubscriptionLoading ||
      !hasProAccess
    ) {
      setIsLoadingUsage(false);
      return;
    }

    setIsLoadingUsage(true);
    setUsageError("");

    try {
      const response = await fetch(
        "/api/ai/image-usage",
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data =
        (await response.json()) as ImageUsageResponse;

      if (
        !response.ok ||
        !data.success ||
        !data.usage
      ) {
        throw new Error(
          data.error ||
            "Image credits could not be loaded.",
        );
      }

      setImageUsage(data.usage);
    } catch (loadError) {
      setUsageError(
        loadError instanceof Error
          ? loadError.message
          : "Image credits could not be loaded.",
      );
    } finally {
      setIsLoadingUsage(false);
    }
  }

  useEffect(() => {
    if (
      isSubscriptionLoading ||
      !hasProAccess
    ) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadImageUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hasProAccess,
    isSubscriptionLoading,
  ]);

  async function generateImage() {
    if (!hasProAccess) {
      setError(
        "SellerOS Pro is required to generate AI images.",
      );
    
      return;
    }

    if (!selectedImageUrl) {
      setError(
        "Select a source image before generating.",
      );

      return;
    }

    if (hasNoCredits) {
      setError(
        "You have reached your monthly AI image-generation limit.",
      );

      return;
    }

    setIsGenerating(true);
    setError("");
    setLibraryMessage("");

    try {
      const orderedImageUrls = [
        selectedImageUrl,
        ...usableImages.filter(
          (url) => url !== selectedImageUrl,
        ),
      ];

      const response = await fetch(
        "/api/ai/generate-image",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            listing: {
              title: listing.title,
              description:
                listing.description ?? "",
              tags: listing.tags ?? [],
              imageUrls: orderedImageUrls,
            },
            style,
            customInstructions,
          }),
        },
      );

      const data =
        (await response.json()) as GenerateImageResponse;

      if (data.usage) {
        setImageUsage(data.usage);
      }

      if (
        !response.ok ||
        !data.success ||
        !data.generatedImage?.imageBase64
      ) {
        throw new Error(
          data.error ||
            "The image could not be generated.",
        );
      }

      const mimeType =
        data.generatedImage.mimeType ||
        "image/png";

      const imageUrl =
        `data:${mimeType};base64,${data.generatedImage.imageBase64}`;

      const historyItem: GeneratedImageHistoryItem = {
        id: crypto.randomUUID(),
        imageUrl,
        mimeType,
        style,
        styleLabel: selectedStyle.label,
        customInstructions:
          customInstructions.trim(),
        sourceImageUrl: selectedImageUrl,
        createdAt: new Date().toISOString(),
      };

      setGeneratedMimeType(mimeType);
      setGeneratedImageUrl(imageUrl);

      setGeneratedImages((currentImages) => [
        historyItem,
        ...currentImages,
      ]);
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "The image could not be generated.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function downloadImage({
    imageUrl,
    mimeType,
    imageStyle,
  }: {
    imageUrl: string;
    mimeType: string;
    imageStyle: EtsyImageStyle;
  }) {
    const link =
      document.createElement("a");

    link.href = imageUrl;
    link.download =
      `selleros-${imageStyle}-image.${getDownloadExtension(
        mimeType,
      )}`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function downloadGeneratedImage() {
    if (!generatedImageUrl) {
      return;
    }

    downloadImage({
      imageUrl: generatedImageUrl,
      mimeType: generatedMimeType,
      imageStyle: style,
    });
  }

  function removeGeneratedImage(
    id: string,
  ) {
    setGeneratedImages((currentImages) =>
      currentImages.filter(
        (image) => image.id !== id,
      ),
    );
  }

  async function saveGeneratedImage(
    generatedImage: GeneratedImageHistoryItem,
  ) {
    if (
      savedImageIds.includes(
        generatedImage.id,
      )
    ) {
      return;
    }

    setSavingImageId(generatedImage.id);
    setLibraryMessage("");
    setError("");

    try {
      const imageBlob = dataUrlToBlob(
        generatedImage.imageUrl,
      );

      await saveAiImage({
        id: generatedImage.id,
        listingId: String(listing.id),
        listingTitle:
          listing.title?.trim() ||
          "Untitled listing",
        imageBlob,
        mimeType: generatedImage.mimeType,
        style: generatedImage.style,
        styleLabel:
          generatedImage.styleLabel,
        customInstructions:
          generatedImage.customInstructions,
        sourceImageUrl:
          generatedImage.sourceImageUrl,
        createdAt: generatedImage.createdAt,
      });

      setSavedImageIds((currentIds) => [
        ...currentIds,
        generatedImage.id,
      ]);

      setLibraryMessage(
        "Image saved to your AI image library.",
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The image could not be saved.",
      );
    } finally {
      setSavingImageId(null);
    }
  }

  if (isSubscriptionLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-5" />
            AI Image Studio
          </CardTitle>

          <CardDescription>
            Create an Etsy-ready presentation using
            one of your real product photos as the
            source.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex min-h-32 items-center justify-center rounded-xl border">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              Checking your SellerOS plan…
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasProAccess) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-5" />
            AI Image Studio
          </CardTitle>
    
          <CardDescription>
            Create Etsy-ready product presentations
            from your existing listing photos.
          </CardDescription>
        </CardHeader>
    
        <CardContent>
          <div className="flex flex-col gap-5 rounded-xl border bg-muted/20 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <LockKeyhole className="size-5" />
              </div>
    
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">
                    AI Image Studio requires SellerOS Pro
                  </p>
    
                  <span className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-xs font-medium">
                    <Sparkles className="size-3" />
                    Pro
                  </span>
                </div>
    
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  Upgrade to generate studio,
                  lifestyle, gift, seasonal, and
                  listing-thumbnail images from your
                  real Etsy product photos.
                </p>
              </div>
            </div>
    
            <Button
              nativeButton={false}
              className="w-full shrink-0 sm:w-auto"
              render={
                <Link href="/subscription" />
              }
            >
              <Sparkles className="size-4" />
              Upgrade to Pro
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (usableImages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            AI Image Studio
          </CardTitle>

          <CardDescription>
            Generate Etsy-ready product images
            using an existing listing photo.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="rounded-xl border border-dashed p-6 text-center">
            <ImageIcon className="mx-auto size-8 text-muted-foreground" />

            <p className="mt-3 font-medium">
              No source images available
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Add at least one product image to
              this Etsy listing before using the
              AI Image Studio.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-5" />
          AI Image Studio
        </CardTitle>

        <CardDescription>
          Create an Etsy-ready presentation using
          one of your real product photos as the
          source.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <section
          className={`rounded-xl border p-4 ${
            hasNoCredits
              ? "border-destructive/30 bg-destructive/5"
              : "bg-muted/20"
          }`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium">
                AI image credits
              </p>

              {isLoadingUsage ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Loading your monthly usage…
                </p>
              ) : imageUsage ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {imageUsage.used} used ·{" "}
                  {imageUsage.remaining} remaining ·{" "}
                  {imageUsage.limit} monthly
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  Your usage balance is currently
                  unavailable.
                </p>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoadingUsage}
              onClick={() =>
                void loadImageUsage()
              }
            >
              <RefreshCw
                className={
                  isLoadingUsage
                    ? "size-4 animate-spin"
                    : "size-4"
                }
              />

              Refresh
            </Button>
          </div>

          {imageUsage ? (
            <>
              <Progress
                value={usagePercentage}
                className="mt-4"
              />

              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>
                  {imageUsage.used} used
                </span>

                <span>
                  {imageUsage.remaining} remaining
                </span>
              </div>
            </>
          ) : null}

          {usageError ? (
            <div
              role="alert"
              className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {usageError}
            </div>
          ) : null}

          {hasNoCredits ? (
            <p className="mt-3 text-sm font-medium text-destructive">
              Your monthly image-generation limit
              has been reached.
            </p>
          ) : null}
        </section>

        <section>
          <p className="text-sm font-medium">
            1. Choose a source image
          </p>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {usableImages.map((imageUrl, index) => {
              const isSelected =
                imageUrl === selectedImageUrl;

              return (
                <button
                  key={imageUrl}
                  type="button"
                  onClick={() =>
                    setSelectedImageUrl(imageUrl)
                  }
                  className={`relative aspect-square overflow-hidden rounded-xl border-2 bg-muted transition ${
                    isSelected
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-transparent hover:border-border"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt={`${listing.title} source image ${
                      index + 1
                    }`}
                    className="size-full object-cover"
                  />

                  {isSelected ? (
                    <span className="absolute bottom-2 left-2 rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                      Selected
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <label
            htmlFor="image-style"
            className="text-sm font-medium"
          >
            2. Choose an image style
          </label>

          <select
            id="image-style"
            value={style}
            onChange={(event) =>
              setStyle(
                event.target
                  .value as EtsyImageStyle,
              )
            }
            className="mt-3 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/30"
          >
            {imageStyles.map((imageStyle) => (
              <option
                key={imageStyle.value}
                value={imageStyle.value}
              >
                {imageStyle.label}
              </option>
            ))}
          </select>

          <p className="mt-2 text-sm text-muted-foreground">
            {selectedStyle.description}
          </p>
        </section>

        <section>
          <label
            htmlFor="custom-image-instructions"
            className="text-sm font-medium"
          >
            3. Additional instructions
          </label>

          <textarea
            id="custom-image-instructions"
            value={customInstructions}
            onChange={(event) =>
              setCustomInstructions(
                event.target.value,
              )
            }
            maxLength={500}
            rows={4}
            placeholder="Example: Use a warm cream background with soft shadows. Keep all product details exactly the same."
            className="mt-3 w-full resize-y rounded-xl border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30"
          />

          <p className="mt-1 text-right text-xs text-muted-foreground">
            {customInstructions.length}/500
          </p>
        </section>

        <Button
          type="button"
          onClick={generateImage}
          disabled={
            isGenerating ||
            isLoadingUsage ||
            !selectedImageUrl ||
            hasNoCredits
          }
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Generating image…
            </>
          ) : hasNoCredits ? (
            <>
              <Sparkles className="size-4" />
              Monthly limit reached
            </>
          ) : generatedImageUrl ? (
            <>
              <RefreshCw className="size-4" />
              Regenerate image
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              Generate Etsy image
            </>
          )}
        </Button>

        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </div>
        ) : null}

        {libraryMessage ? (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
          >
            {libraryMessage}
          </div>
        ) : null}

        {generatedImageUrl ? (
          <section className="space-y-3">
            <div>
              <p className="text-sm font-medium">
                Generated image
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Review the image carefully to
                confirm that the physical product
                remains accurate.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={generatedImageUrl}
                alt={`Generated ${selectedStyle.label} image for ${listing.title}`}
                className="h-auto w-full object-contain"
              />
            </div>
          </section>
        ) : null}

        {generatedImages.length > 0 ? (
          <section className="space-y-3 border-t pt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">
                  Generation history
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Images generated during this
                  session.
                </p>
              </div>

              <span className="text-xs text-muted-foreground">
                {generatedImages.length}{" "}
                {generatedImages.length === 1
                  ? "image"
                  : "images"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {generatedImages.map(
                (generatedImage) => (
                  <article
                    key={generatedImage.id}
                    className="overflow-hidden rounded-xl border bg-card"
                  >
                    <div className="aspect-square bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          generatedImage.imageUrl
                        }
                        alt={`Generated ${generatedImage.styleLabel} image for ${listing.title}`}
                        className="size-full object-contain"
                      />
                    </div>

                    <div className="space-y-3 p-3">
                      <div>
                        <p className="text-sm font-medium">
                          {
                            generatedImage.styleLabel
                          }
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(
                            generatedImage.createdAt,
                          ).toLocaleString()}
                        </p>
                      </div>

                      {generatedImage.customInstructions ? (
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {
                            generatedImage.customInstructions
                          }
                        </p>
                      ) : null}

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            downloadImage({
                              imageUrl:
                                generatedImage.imageUrl,
                              mimeType:
                                generatedImage.mimeType,
                              imageStyle:
                                generatedImage.style,
                            })
                          }
                        >
                          <Download className="size-4" />
                          Download
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          disabled={
                            savingImageId ===
                              generatedImage.id ||
                            savedImageIds.includes(
                              generatedImage.id,
                            )
                          }
                          onClick={() =>
                            void saveGeneratedImage(
                              generatedImage,
                            )
                          }
                        >
                          {savingImageId ===
                          generatedImage.id ? (
                            <>
                              <LoaderCircle className="size-4 animate-spin" />
                              Saving…
                            </>
                          ) : savedImageIds.includes(
                              generatedImage.id,
                            ) ? (
                            <>
                              <Save className="size-4" />
                              Saved
                            </>
                          ) : (
                            <>
                              <Save className="size-4" />
                              Save
                            </>
                          )}
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="col-span-2"
                          onClick={() =>
                            removeGeneratedImage(
                              generatedImage.id,
                            )
                          }
                        >
                          Remove from session history
                        </Button>
                      </div>
                    </div>
                  </article>
                ),
              )}
            </div>
          </section>
        ) : null}
      </CardContent>

      {generatedImageUrl ? (
        <CardFooter className="justify-end border-t">
          <Button
            type="button"
            variant="outline"
            onClick={downloadGeneratedImage}
          >
            <Download className="size-4" />
            Download image
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}