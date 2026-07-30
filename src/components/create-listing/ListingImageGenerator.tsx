"use client";

import {
  Download,
  ImageIcon,
  LoaderCircle,
  RefreshCw,
  Sparkles,
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
import { Progress } from "@/components/ui/progress";

export type ListingImagePlanItem = {
  id: string;
  type:
    | "studio"
    | "lifestyle"
    | "detail"
    | "scale"
    | "gift"
    | "seasonal";
  title: string;
  description: string;
  generationInstructions: string;
};

type ImageUsage = {
  used: number;
  limit: number;
  remaining: number;
  billingMonth: string;
};

type GeneratedListingImage = {
  imageBase64: string;
  mimeType: string;
  promptUsed: string;
};

type GeneratedImageState = {
  status:
    | "idle"
    | "generating"
    | "complete"
    | "error";
  imageUrl?: string;
  mimeType?: string;
  promptUsed?: string;
  error?: string;
};

type GenerateListingImageResponse = {
  success: boolean;
  generatedImage?: GeneratedListingImage;
  usage?: ImageUsage;
  error?: string;
};

type ImageUsageResponse = {
  success: boolean;
  usage?: ImageUsage;
  error?: string;
};

type SaveGeneratedImageResponse = {
  success: boolean;
  image?: {
    id: string;
    projectId: string;
    imageKind: string;
    imageRank: number;
    storagePath: string | null;
    mimeType: string | null;
    generationStatus: string;
  };
  error?: string;
};

type SavedProjectImage = {
  id: string;
  projectId: string;
  imageKind: string;
  imageRank: number;
  storagePath: string | null;
  signedUrl: string | null;
  mimeType: string | null;
  originalFilename: string | null;
  conceptTitle: string | null;
  conceptDescription: string | null;
  generationInstructions: string | null;
  promptUsed: string | null;
  altText: string | null;
  generationStatus: string;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

type LoadProjectImagesResponse = {
  success: boolean;
  projectId?: string;
  images?: SavedProjectImage[];
  error?: string;
};

type Props = {
  projectId?: string | null;
  sourceImage: File;
  productTitle: string;
  productDescription: string;
  imagePlan: ListingImagePlanItem[];
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

function base64ToFile({
  imageBase64,
  mimeType,
  filename,
}: {
  imageBase64: string;
  mimeType: string;
  filename: string;
}) {
  const binaryString =
    window.atob(imageBase64);

  const bytes =
    new Uint8Array(binaryString.length);

  for (
    let index = 0;
    index < binaryString.length;
    index += 1
  ) {
    bytes[index] =
      binaryString.charCodeAt(index);
  }

  return new File(
    [bytes],
    filename,
    {
      type: mimeType,
    },
  );
}

export default function ListingImageGenerator({
  projectId,
  sourceImage,
  productTitle,
  productDescription,
  imagePlan,
}: Props) {
  const initialImageStates = useMemo(
    () =>
      Object.fromEntries(
        imagePlan.map((item) => [
          item.id,
          {
            status: "idle",
          } satisfies GeneratedImageState,
        ]),
      ) as Record<
        string,
        GeneratedImageState
      >,
    [imagePlan],
  );

  const [
    generatedImageStates,
    setGeneratedImageStates,
  ] = useState<
    Record<string, GeneratedImageState>
  >(initialImageStates);

  const [usage, setUsage] =
    useState<ImageUsage | null>(null);

  const [isLoadingUsage, setIsLoadingUsage] =
    useState(true);

    const [
      isLoadingSavedImages,
      setIsLoadingSavedImages,
    ] = useState(false);

  const [isGeneratingAll, setIsGeneratingAll] =
    useState(false);

  const [currentImageNumber, setCurrentImageNumber] =
    useState(0);

  const [batchError, setBatchError] =
    useState("");

  const completedCount = Object.values(
    generatedImageStates,
  ).filter(
    (item) => item.status === "complete",
  ).length;

  const hasNoCredits =
    usage !== null && usage.remaining <= 0;

  const progressPercentage =
    imagePlan.length > 0
      ? Math.round(
          (completedCount / imagePlan.length) *
            100,
        )
      : 0;

  async function loadUsage() {
    setIsLoadingUsage(true);

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

      setUsage(data.usage);
    } catch (error) {
      setBatchError(
        error instanceof Error
          ? error.message
          : "Image credits could not be loaded.",
      );
    } finally {
      setIsLoadingUsage(false);
    }
  }

  async function loadSavedImages() {
      setGeneratedImageStates(
        initialImageStates,
      );

      if (!projectId) {
        return;
      }

      setIsLoadingSavedImages(true);

      try {
        const response = await fetch(
          `/api/listing-projects/images?projectId=${encodeURIComponent(
            projectId,
          )}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const data =
          (await response.json()) as LoadProjectImagesResponse;

        if (!response.ok || !data.success) {
          throw new Error(
            data.error ||
              "Saved listing images could not be loaded.",
          );
        }

        const generatedImages =
          (data.images ?? []).filter(
            (image) =>
              image.imageKind !== "source" &&
              image.generationStatus ===
                "complete" &&
              Boolean(image.signedUrl),
          );

        setGeneratedImageStates(
          (currentStates) => {
            const nextStates = {
              ...currentStates,
            };

            generatedImages.forEach(
              (savedImage) => {
                const matchingPlanItem =
                  imagePlan[
                    savedImage.imageRank - 1
                  ];

                if (
                  !matchingPlanItem ||
                  matchingPlanItem.type !==
                    savedImage.imageKind ||
                  !savedImage.signedUrl
                ) {
                  return;
                }

                nextStates[
                  matchingPlanItem.id
                ] = {
                  status: "complete",
                  imageUrl:
                    savedImage.signedUrl,
                  mimeType:
                    savedImage.mimeType ??
                    "image/png",
                  promptUsed:
                    savedImage.promptUsed ??
                    undefined,
                };
              },
            );

            return nextStates;
          },
        );
      } catch (error) {
        setBatchError(
          error instanceof Error
            ? error.message
            : "Saved listing images could not be loaded.",
        );
      } finally {
        setIsLoadingSavedImages(false);
      }
    }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadUsage();
  }, []);

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  void loadSavedImages();
}, [projectId, initialImageStates]);

  async function saveGeneratedImage({
  imagePlanItem,
  imageRank,
  imageBase64,
  mimeType,
  promptUsed,
}: {
  imagePlanItem: ListingImagePlanItem;
  imageRank: number;
  imageBase64: string;
  mimeType: string;
  promptUsed: string;
}) {
  if (!projectId) {
    throw new Error(
      "The listing project ID is unavailable.",
    );
  }

  const extension =
    getDownloadExtension(mimeType);

  const generatedFile =
    base64ToFile({
      imageBase64,
      mimeType,
      filename:
        `selleros-${imagePlanItem.type}-${imageRank}.${extension}`,
    });

  const uploadFormData =
    new FormData();

  uploadFormData.append(
    "projectId",
    projectId,
  );

  uploadFormData.append(
    "imageKind",
    imagePlanItem.type,
  );

  uploadFormData.append(
    "imageRank",
    String(imageRank),
  );

  uploadFormData.append(
    "conceptTitle",
    imagePlanItem.title,
  );

  uploadFormData.append(
    "conceptDescription",
    imagePlanItem.description,
  );

  uploadFormData.append(
    "generationInstructions",
    imagePlanItem.generationInstructions,
  );

  uploadFormData.append(
    "promptUsed",
    promptUsed,
  );

  uploadFormData.append(
    "altText",
    `${imagePlanItem.title} for ${productTitle}`,
  );

  uploadFormData.append(
    "generatedImage",
    generatedFile,
  );

  const response = await fetch(
    "/api/listing-projects/generated-images",
    {
      method: "POST",
      body: uploadFormData,
    },
  );

  const data =
    (await response.json()) as SaveGeneratedImageResponse;

  if (!response.ok || !data.success) {
    throw new Error(
      data.error ||
        "The generated image could not be saved.",
    );
  }
}

  async function generateImage(
    imagePlanItem: ListingImagePlanItem,
  ) {
    setGeneratedImageStates(
      (currentStates) => ({
        ...currentStates,
        [imagePlanItem.id]: {
          status: "generating",
        },
      }),
    );

    const formData = new FormData();

    formData.append(
      "sourceImage",
      sourceImage,
    );

    formData.append(
      "productTitle",
      productTitle,
    );

    formData.append(
      "productDescription",
      productDescription,
    );

    formData.append(
      "imageType",
      imagePlanItem.type,
    );

    formData.append(
      "conceptTitle",
      imagePlanItem.title,
    );

    formData.append(
      "conceptDescription",
      imagePlanItem.description,
    );

    formData.append(
      "generationInstructions",
      imagePlanItem.generationInstructions,
    );

    try {
      const response = await fetch(
        "/api/ai/generate-listing-image",
        {
          method: "POST",
          body: formData,
        },
      );

      const data =
        (await response.json()) as GenerateListingImageResponse;

      if (data.usage) {
        setUsage(data.usage);
      }

      if (
        !response.ok ||
        !data.success ||
        !data.generatedImage?.imageBase64
      ) {
        throw new Error(
          data.error ||
            "The listing image could not be generated.",
        );
      }

      const mimeType =
        data.generatedImage.mimeType ||
        "image/png";

      const imageUrl =
        `data:${mimeType};base64,${data.generatedImage.imageBase64}`;
        
      const imageRank =
        imagePlan.findIndex(
          (item) =>
            item.id === imagePlanItem.id,
        ) + 1;
    
      if (imageRank < 1) {
        throw new Error(
          "The generated image position could not be determined.",
        );
      }
      
      await saveGeneratedImage({
        imagePlanItem,
        imageRank,
        imageBase64:
          data.generatedImage.imageBase64,
        mimeType,
        promptUsed:
          data.generatedImage.promptUsed,
      });
      
      setGeneratedImageStates(
        (currentStates) => ({
          ...currentStates,
          [imagePlanItem.id]: {
            status: "complete",
            imageUrl,
            mimeType,
            promptUsed:
              data.generatedImage?.promptUsed,
          },
        }),
      );

      return true;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "The listing image could not be generated.";

      setGeneratedImageStates(
        (currentStates) => ({
          ...currentStates,
          [imagePlanItem.id]: {
            status: "error",
            error: message,
          },
        }),
      );

      throw error;
    }
  }

  async function generateAllImages() {
    setBatchError("");
    setIsGeneratingAll(true);
    setCurrentImageNumber(0);

    try {
      for (
        let index = 0;
        index < imagePlan.length;
        index += 1
      ) {
        const item = imagePlan[index];

        const existingState =
          generatedImageStates[item.id];

        if (
          existingState?.status === "complete"
        ) {
          continue;
        }

        if (
          usage &&
          usage.remaining <= 0
        ) {
          throw new Error(
            "You have reached your monthly AI image-generation limit.",
          );
        }

        setCurrentImageNumber(index + 1);

        await generateImage(item);
      }
    } catch (error) {
      setBatchError(
        error instanceof Error
          ? error.message
          : "The image batch could not be completed.",
      );
    } finally {
      setIsGeneratingAll(false);
      setCurrentImageNumber(0);
      await loadUsage();
    }
  }

  async function regenerateImage(
    item: ListingImagePlanItem,
  ) {
    setBatchError("");

    try {
      await generateImage(item);
    } catch {
      // Per-image error is displayed inside its card.
    }
  }

  function downloadImage(
    item: ListingImagePlanItem,
  ) {
    const generatedState =
      generatedImageStates[item.id];

    if (
      !generatedState?.imageUrl ||
      !generatedState.mimeType
    ) {
      return;
    }

    const link =
      document.createElement("a");

    link.href =
      generatedState.imageUrl;

    link.download =
      `selleros-${item.type}-listing-image.${getDownloadExtension(
        generatedState.mimeType,
      )}`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function downloadAllImages() {
    imagePlan.forEach(
      (item, index) => {
        const generatedState =
          generatedImageStates[item.id];

        if (
          !generatedState?.imageUrl ||
          !generatedState.mimeType
        ) {
          return;
        }

        window.setTimeout(() => {
          downloadImage(item);
        }, index * 250);
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="size-5" />
          Generate listing images
        </CardTitle>

        <CardDescription>
          Generate each planned image from your
          primary uploaded product photo. Each
          generated image uses one image credit.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="rounded-xl border bg-muted/20 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {isLoadingSavedImages ? (
              <div
                role="status"
                className="flex items-center gap-3 rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground"
              >
                <LoaderCircle className="size-4 animate-spin" />
                Loading saved listing images…
              </div>
            ) : null}
            <div>
              <p className="text-sm font-medium">
                Image credits
              </p>

              {isLoadingUsage ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Loading credit balance…
                </p>
              ) : usage ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {usage.used} used ·{" "}
                  {usage.remaining} remaining ·{" "}
                  {usage.limit} monthly
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  Credit balance unavailable
                </p>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoadingUsage}
              onClick={() => void loadUsage()}
            >
              <RefreshCw
                className={
                  isLoadingUsage
                    ? "size-4 animate-spin"
                    : "size-4"
                }
              />
              Refresh credits
            </Button>
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">
                Six-image listing package
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {completedCount} of{" "}
                {imagePlan.length} images completed
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              {completedCount > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadAllImages}
                >
                  <Download className="size-4" />
                  Download completed
                </Button>
              ) : null}

              <Button
                type="button"
                disabled={
                  isGeneratingAll ||
                  isLoadingUsage ||
                  hasNoCredits ||
                  isLoadingSavedImages ||
                  completedCount ===
                    imagePlan.length
                }
                onClick={() =>
                  void generateAllImages()
                }
              >
                {isGeneratingAll ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Generating image{" "}
                    {currentImageNumber} of{" "}
                    {imagePlan.length}…
                  </>
                ) : completedCount > 0 ? (
                  <>
                    <Sparkles className="size-4" />
                    Generate remaining
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Generate all 6 images
                  </>
                )}
              </Button>
            </div>
          </div>

          <Progress
            value={progressPercentage}
            className="mt-4"
          />

          <p className="mt-2 text-right text-xs text-muted-foreground">
            {progressPercentage}% complete
          </p>
        </div>

        {batchError ? (
          <div
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
          >
            {batchError}
          </div>
        ) : null}

        {hasNoCredits ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Your monthly image-generation limit
            has been reached.
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {imagePlan.map((item, index) => {
            const generatedState =
              generatedImageStates[item.id] ?? {
                status: "idle",
              };

            const isGenerating =
              generatedState.status ===
              "generating";

            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-xl border bg-card"
              >
                <div className="flex aspect-square items-center justify-center bg-muted">
                  {isGenerating ? (
                    <div className="text-center">
                      <LoaderCircle className="mx-auto size-8 animate-spin text-primary" />

                      <p className="mt-3 text-sm font-medium">
                        Generating image{" "}
                        {index + 1}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        This may take a moment.
                      </p>
                    </div>
                  ) : generatedState.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={
                        generatedState.imageUrl
                      }
                      alt={`${item.title} generated listing image`}
                      className="size-full object-contain"
                    />
                  ) : (
                    <div className="px-6 text-center">
                      <ImageIcon className="mx-auto size-8 text-muted-foreground" />

                      <p className="mt-3 text-sm font-medium">
                        Image {index + 1}
                      </p>

                      <p className="mt-1 text-xs capitalize text-muted-foreground">
                        {item.type}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-3 p-4">
                  <div>
                    <p className="font-medium">
                      {item.title}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>

                  {generatedState.error ? (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                      {generatedState.error}
                    </div>
                  ) : null}

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={
                        generatedState.status ===
                        "complete"
                          ? "outline"
                          : "default"
                      }
                      disabled={
                        isGenerating ||
                        isGeneratingAll ||
                        isLoadingSavedImages ||
                        isLoadingUsage ||
                        hasNoCredits
                      }
                      onClick={() =>
                        void regenerateImage(item)
                      }
                    >
                      {isGenerating ? (
                        <>
                          <LoaderCircle className="size-4 animate-spin" />
                          Generating…
                        </>
                      ) : generatedState.status ===
                        "complete" ? (
                        <>
                          <RefreshCw className="size-4" />
                          Regenerate
                        </>
                      ) : (
                        <>
                          <Sparkles className="size-4" />
                          Generate
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      disabled={
                        generatedState.status !==
                        "complete"
                      }
                      onClick={() =>
                        downloadImage(item)
                      }
                    >
                      <Download className="size-4" />
                      Download
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}