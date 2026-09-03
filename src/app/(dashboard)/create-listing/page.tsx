"use client";

import Link from "next/link";
import {
  FilePlus2,
  ImageIcon,
  LoaderCircle,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
  LockKeyhole,
} from "lucide-react";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ListingImageGenerator from "@/components/create-listing/ListingImageGenerator";
import EtsyExportPanel from "@/components/create-listing/EtsyExportPanel";

type UploadedImage = {
  id: string;
  file: File;
  previewUrl: string;
};

type ListingFormData = {
  productName: string;
  productDescription: string;
  productType: string;
  materials: string;
  primaryColor: string;
  secondaryColor: string;
  dimensions: string;
  price: string;
  quantity: string;
  occasion: string;
  personalization: string;
  productionTime: string;
};

type ListingImagePlanItem = {
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

type GeneratedListingPackage = {
  title: string;
  description: string;
  tags: string[];
  materials: string[];
  highlights: string[];
  imagePlan: ListingImagePlanItem[];
};

type GenerateListingResponse = {
  success: boolean;
  projectId?: string;
  projectStatus?: string;
  listingPackage?: GeneratedListingPackage;
  error?: string;
};

type SaveSourceImagesResponse = {
  success: boolean;
  projectId?: string;
  images?: {
    id: string;
    imageKind: string;
    imageRank: number;
    storagePath: string | null;
    mimeType: string | null;
    originalFilename: string | null;
  }[];
  error?: string;
};

type SavedListingProject = {
  id: string;
  status: string;
  formData: ListingFormData;
  listingPackage: GeneratedListingPackage | null;
  sourceImageCount: number;
  generatedImageCount: number;
  etsyListingId: number | null;
  etsyListingUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

type LoadListingProjectResponse = {
  success: boolean;
  project?: SavedListingProject;
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
  generationStatus: string;
};

type LoadProjectImagesResponse = {
  success: boolean;
  projectId?: string;
  images?: SavedProjectImage[];
  error?: string;
};

type SaveListingProjectResponse = {
  success: boolean;
  projectId?: string;
  status?: string;
  updatedAt?: string;
  error?: string;
};

const initialFormData: ListingFormData = {
  productName: "",
  productDescription: "",
  productType: "",
  materials: "",
  primaryColor: "",
  secondaryColor: "",
  dimensions: "",
  price: "",
  quantity: "1",
  occasion: "",
  personalization: "no",
  productionTime: "",
};

const inputClassName =
  "mt-2 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/30";

const textareaClassName =
  "mt-2 w-full resize-y rounded-xl border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30";

async function loadSourceImageAsUpload(
  image: SavedProjectImage,
): Promise<UploadedImage> {
  if (!image.signedUrl) {
    throw new Error(
      "A saved source image URL is unavailable.",
    );
  }
  const response = await fetch(
    image.signedUrl,
  );
  if (!response.ok) {
    throw new Error(
      "A saved source image could not be downloaded.",
    );
  }
  const blob = await response.blob();
  const mimeType =
    image.mimeType ||
    blob.type ||
    "image/png";
  const extension =
    mimeType.includes("jpeg")
      ? "jpg"
      : mimeType.includes("webp")
        ? "webp"
        : "png";
  const filename =
    image.originalFilename ||
    `source-${image.imageRank}.${extension}`;
  const file = new File(
    [blob],
    filename,
    {
      type: mimeType,
    },
  );
  return {
    id: image.id,
    file,
    previewUrl:
      URL.createObjectURL(file),
  };
}

export default function CreateListingPage() {
  const {
    hasProAccess,
    isLoading: isSubscriptionLoading,
  } = useSubscription();
  const [formData, setFormData] =
    useState<ListingFormData>(initialFormData);

  const [uploadedImages, setUploadedImages] =
    useState<UploadedImage[]>([]);

  const [
    generatedListing,
    setGeneratedListing,
  ] = useState<GeneratedListingPackage | null>(
    null,
  );

  const [projectId, setProjectId] =
  useState<string | null>(null);

  const [
      sourceImagesSavedProjectId,
      setSourceImagesSavedProjectId,
    ] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [isGenerating, setIsGenerating] =
    useState(false);

    const [isSaving, setIsSaving] =
  useState(false);

    const [
      isLoadingProject,
      setIsLoadingProject,
    ] = useState(false);

    useEffect(() => {
      if (
        isSubscriptionLoading ||
        !hasProAccess
      ) {
        return;
      }
      const urlProjectId =
        new URLSearchParams(
          window.location.search,
        )
          .get("projectId")
          ?.trim();

      if (!urlProjectId) {
        return;
      }
      
      const requestedProjectId =
        urlProjectId;
      
      let isCancelled = false;

      async function loadProject() {
        setIsLoadingProject(true);
        setError("");
        setMessage("");

        try {
          const projectResponse =
            await fetch(
              `/api/listing-projects?projectId=${encodeURIComponent(
                requestedProjectId,
              )}`,
              {
                method: "GET",
                cache: "no-store",
              },
            );

          const projectData =
            (await projectResponse.json()) as LoadListingProjectResponse;

          if (
            !projectResponse.ok ||
            !projectData.success ||
            !projectData.project
          ) {
            throw new Error(
              projectData.error ||
                "The listing project could not be loaded.",
            );
          }

          const imagesResponse =
            await fetch(
              `/api/listing-projects/images?projectId=${encodeURIComponent(
                requestedProjectId,
              )}`,
              {
                method: "GET",
                cache: "no-store",
              },
            );

          const imagesData =
            (await imagesResponse.json()) as LoadProjectImagesResponse;

          if (
            !imagesResponse.ok ||
            !imagesData.success
          ) {
            throw new Error(
              imagesData.error ||
                "The saved project images could not be loaded.",
            );
          }

          const sourceImages =
            (imagesData.images ?? [])
              .filter(
                (image) =>
                  image.imageKind ===
                    "source" &&
                  image.generationStatus ===
                    "complete" &&
                  Boolean(image.signedUrl),
              )
              .sort(
                (firstImage, secondImage) =>
                  firstImage.imageRank -
                  secondImage.imageRank,
              );

          const restoredUploads =
            await Promise.all(
              sourceImages.map(
                loadSourceImageAsUpload,
              ),
            );

          if (isCancelled) {
            restoredUploads.forEach(
              (image) => {
                URL.revokeObjectURL(
                  image.previewUrl,
                );
              },
            );

            return;
          }

          setProjectId(
            projectData.project.id,
          );

          setFormData(
            projectData.project.formData,
          );

          setGeneratedListing(
            projectData.project
              .listingPackage,
          );

          setUploadedImages(
            restoredUploads,
          );

          setSourceImagesSavedProjectId(
            projectData.project.id,
          );

          setMessage(
            "Your saved listing project has been restored.",
          );
        } catch (loadError) {
          if (!isCancelled) {
            setError(
              loadError instanceof Error
                ? loadError.message
                : "The listing project could not be loaded.",
            );
          }
        } finally {
          if (!isCancelled) {
            setIsLoadingProject(false);
          }
        }
      }

      void loadProject();

      return () => {
        isCancelled = true;
      };
    }, [
      hasProAccess,
      isSubscriptionLoading,
    ]);

  const canGenerate = useMemo(
    () =>
      formData.productName.trim().length > 0 &&
      formData.productDescription.trim().length >
        0 &&
      uploadedImages.length > 0,
    [
      formData.productDescription,
      formData.productName,
      uploadedImages.length,
    ],
  );

  function updateField(
    field: keyof ListingFormData,
    value: string,
  ) {
    setFormData((currentData) => ({
      ...currentData,
      [field]: value,
    }));

    setError("");
    setMessage("");
  }

  function handleImageUpload(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const selectedFiles = Array.from(
      event.target.files ?? [],
    );

    event.target.value = "";

    if (selectedFiles.length === 0) {
      return;
    }

    const remainingSlots =
      3 - uploadedImages.length;

    if (remainingSlots <= 0) {
      setError(
        "You can upload up to 3 original product photos.",
      );

      return;
    }

    const validFiles = selectedFiles.filter(
      (file) => file.type.startsWith("image/"),
    );

    if (
      validFiles.length !==
      selectedFiles.length
    ) {
      setError(
        "Only PNG, JPG, JPEG, and WebP image files can be uploaded.",
      );
    } else {
      setError("");
    }

    const newImages = validFiles
      .slice(0, remainingSlots)
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl:
          URL.createObjectURL(file),
      }));

    setUploadedImages((currentImages) => [
      ...currentImages,
      ...newImages,
    ]);

    setMessage("");
    setSourceImagesSavedProjectId(null);
  }

  function removeImage(id: string) {
    setUploadedImages((currentImages) => {
      const imageToRemove =
        currentImages.find(
          (image) => image.id === id,
        );

      if (imageToRemove) {
        URL.revokeObjectURL(
          imageToRemove.previewUrl,
        );
      }

      return currentImages.filter(
        (image) => image.id !== id,
      );
    });

    setError("");
    setMessage("");
    setSourceImagesSavedProjectId(null);
  }

  function updateGeneratedText(
    field: "title" | "description",
    value: string,
  ) {
    setGeneratedListing((currentListing) => {
      if (!currentListing) {
        return currentListing;
      }

      return {
        ...currentListing,
        [field]: value,
      };
    });
  }

  function updateGeneratedArrayItem(
    field: "tags" | "materials" | "highlights",
    index: number,
    value: string,
  ) {
    setGeneratedListing((currentListing) => {
      if (!currentListing) {
        return currentListing;
      }

      return {
        ...currentListing,
        [field]: currentListing[field].map(
          (item, itemIndex) =>
            itemIndex === index ? value : item,
        ),
      };
    });
  }

  function updateImagePlanItem(
    index: number,
    field:
      | "title"
      | "description"
      | "generationInstructions",
    value: string,
  ) {
    setGeneratedListing((currentListing) => {
      if (!currentListing) {
        return currentListing;
      }

      return {
        ...currentListing,
        imagePlan:
          currentListing.imagePlan.map(
            (item, itemIndex) =>
              itemIndex === index
                ? {
                    ...item,
                    [field]: value,
                  }
                : item,
          ),
      };
    });
  }



  async function saveSourceImages(
      listingProjectId: string,
    ) {
      const uploadFormData = new FormData();

      uploadFormData.append(
        "projectId",
        listingProjectId,
      );

      uploadedImages.forEach((image) => {
        uploadFormData.append(
          "sourceImages",
          image.file,
        );
      });

      const response = await fetch(
        "/api/listing-projects/source-images",
        {
          method: "POST",
          body: uploadFormData,
        },
      );

      const data =
        (await response.json()) as SaveSourceImagesResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "The original product photos could not be saved.",
        );
      }

      setSourceImagesSavedProjectId(
        listingProjectId,
      );
    }

    async function saveListingChanges() {
  setError("");
  setMessage("");

  if (!projectId) {
    setError(
      "Generate the listing before saving changes.",
    );

    return;
  }

  if (!generatedListing) {
    setError(
      "There is no generated listing package to save.",
    );

    return;
  }

  setIsSaving(true);

  try {
    const response = await fetch(
      "/api/listing-projects",
      {
        method: "PATCH",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          projectId,
          formData,
          listingPackage:
            generatedListing,
        }),
      },
    );

    const data =
      (await response.json()) as SaveListingProjectResponse;

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data.error ||
          "The listing changes could not be saved.",
      );
    }

    if (
      sourceImagesSavedProjectId !==
      projectId
    ) {
      await saveSourceImages(
        projectId,
      );
    }

    setMessage(
      "Your listing changes have been saved.",
    );
  } catch (saveError) {
    setError(
      saveError instanceof Error
        ? saveError.message
        : "The listing changes could not be saved.",
    );
  } finally {
    setIsSaving(false);
  }
}

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!formData.productName.trim()) {
      setError(
        "Enter a product name before generating the listing.",
      );

      return;
    }

    if (
      !formData.productDescription.trim()
    ) {
      setError(
        "Describe the product before generating the listing.",
      );

      return;
    }

    if (uploadedImages.length === 0) {
      setError(
        "Upload at least one original product photo.",
      );

      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch(
        "/api/ai/generate-listing",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
              ...formData,
              projectId,
            }),
        },
      );

      const data =
        (await response.json()) as GenerateListingResponse;

      if (
        !response.ok ||
        !data.success ||
        !data.listingPackage
      ) {
        throw new Error(
          data.error ||
            "The listing package could not be generated.",
        );
      }

      if (!data.projectId) {
        throw new Error(
          "The listing project ID was not returned.",
        );
      }
      
      setProjectId(data.projectId);

      if (
        sourceImagesSavedProjectId !==
        data.projectId
      ) {
        await saveSourceImages(
          data.projectId,
        );
      }
      
      setGeneratedListing(
        data.listingPackage,
      );
      
      setMessage(
        "Your AI listing package and original product photos have been saved. Review and edit every section before publishing.",
      );

      window.setTimeout(() => {
        document
          .getElementById(
            "generated-listing-package",
          )
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 100);
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "The listing package could not be generated.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  if (isSubscriptionLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <FilePlus2 className="size-5" />
          </div>
    
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Create Listing
            </h1>
    
            <p className="mt-1 text-sm text-muted-foreground">
              Build a complete Etsy listing from
              your product photos and details.
            </p>
          </div>
        </div>
    
        <Card>
          <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            Checking your SellerOS plan…
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!hasProAccess) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <FilePlus2 className="size-5" />
          </div>
    
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Create Listing
            </h1>
    
            <p className="mt-1 text-sm text-muted-foreground">
              Build a complete Etsy listing from
              your product photos and details.
            </p>
          </div>
        </div>
    
        <Card className="border-primary/20">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <LockKeyhole className="size-5" />
                </div>
    
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">
                      Create Listing requires SellerOS Pro
                    </h2>
    
                    <span className="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-2 py-0.5 text-xs font-medium">
                      <Sparkles className="size-3" />
                      Pro
                    </span>
                  </div>
    
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Upgrade to build complete Etsy listings
                    with AI-generated titles, descriptions,
                    tags, materials, image concepts, and
                    product images.
                  </p>
    
                  <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      AI listing package
                    </div>
    
                    <div className="rounded-lg border bg-muted/20 p-3">
                      Six-image generation plan
                    </div>
    
                    <div className="rounded-lg border bg-muted/20 p-3">
                      AI product images
                    </div>
    
                    <div className="rounded-lg border bg-muted/20 p-3">
                      Etsy draft export
                    </div>
                  </div>
                </div>
              </div>
    
              <Button
                nativeButton={false}
                size="lg"
                className="w-full shrink-0 lg:w-auto"
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <FilePlus2 className="size-5" />
        </div>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Create Listing
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Build a complete Etsy listing from
            your product photos and details.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="size-4" />
              Upload product photos
            </CardTitle>

            <CardDescription>
              Add up to three clear photos of the
              real product.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FilePlus2 className="size-4" />
              Describe the product
            </CardTitle>

            <CardDescription>
              Provide accurate product details,
              materials, size, and pricing.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4" />
              Generate the listing
            </CardTitle>

            <CardDescription>
              Create a title, description, tags,
              materials, highlights, and image
              plan.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {isLoadingProject ? (
          <div
            role="status"
            className="flex items-center gap-3 rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground"
          >
            <LoaderCircle className="size-4 animate-spin" />
            Loading saved listing project…
          </div>
        ) : null}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>
              Original product photos
            </CardTitle>

            <CardDescription>
              Upload photos that clearly show the
              actual product. SellerOS will use
              them as references when generating
              listing images later.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center transition hover:bg-muted/40">
              <div className="flex size-11 items-center justify-center rounded-full bg-muted">
                <Upload className="size-5 text-muted-foreground" />
              </div>

              <p className="mt-3 text-sm font-medium">
                Upload product photos
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                PNG, JPG or WebP · Maximum 3
                photos
              </p>

              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="sr-only"
                disabled={
                  uploadedImages.length >= 3
                }
                onChange={handleImageUpload}
              />
            </label>

            {uploadedImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {uploadedImages.map(
                  (image, index) => (
                    <article
                      key={image.id}
                      className="overflow-hidden rounded-xl border bg-card"
                    >
                      <div className="relative aspect-square bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image.previewUrl}
                          alt={`Uploaded product image ${
                            index + 1
                          }`}
                          className="size-full object-cover"
                        />

                        {index === 0 ? (
                          <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                            Primary reference
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center justify-between gap-2 p-3">
                        <p className="min-w-0 truncate text-xs text-muted-foreground">
                          {image.file.name}
                        </p>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove ${image.file.name}`}
                          onClick={() =>
                            removeImage(image.id)
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </article>
                  ),
                )}

                {uploadedImages.length < 3 ? (
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed text-center transition hover:bg-muted/40">
                    <Plus className="size-5 text-muted-foreground" />

                    <span className="mt-2 text-sm font-medium">
                      Add photo
                    </span>

                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      className="sr-only"
                      onChange={handleImageUpload}
                    />
                  </label>
                ) : null}
              </div>
            ) : null}

            <p className="text-xs text-muted-foreground">
              {uploadedImages.length}/3 photos
              uploaded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Product information
            </CardTitle>

            <CardDescription>
              Use accurate information so the
              generated listing does not make
              incorrect product claims.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <label
                htmlFor="product-name"
                className="text-sm font-medium"
              >
                Product name
                <span className="text-destructive">
                  {" "}
                  *
                </span>
              </label>

              <input
                id="product-name"
                type="text"
                value={formData.productName}
                maxLength={140}
                placeholder="Example: Handmade pearl couple rakhi set"
                className={inputClassName}
                onChange={(event) =>
                  updateField(
                    "productName",
                    event.target.value,
                  )
                }
              />

              <p className="mt-1 text-right text-xs text-muted-foreground">
                {formData.productName.length}/140
              </p>
            </div>

            <div>
              <label
                htmlFor="product-description"
                className="text-sm font-medium"
              >
                Describe the product
                <span className="text-destructive">
                  {" "}
                  *
                </span>
              </label>

              <textarea
                id="product-description"
                value={
                  formData.productDescription
                }
                maxLength={2000}
                rows={6}
                placeholder="Describe what the product is, how it is made, what is included, its design, materials, colors, and who it is for."
                className={textareaClassName}
                onChange={(event) =>
                  updateField(
                    "productDescription",
                    event.target.value,
                  )
                }
              />

              <p className="mt-1 text-right text-xs text-muted-foreground">
                {
                  formData.productDescription
                    .length
                }
                /2000
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="product-type"
                  className="text-sm font-medium"
                >
                  Product type
                </label>

                <input
                  id="product-type"
                  type="text"
                  value={formData.productType}
                  placeholder="Example: Rakhi, earrings, necklace"
                  className={inputClassName}
                  onChange={(event) =>
                    updateField(
                      "productType",
                      event.target.value,
                    )
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="materials"
                  className="text-sm font-medium"
                >
                  Materials
                </label>

                <input
                  id="materials"
                  type="text"
                  value={formData.materials}
                  placeholder="Example: Cotton thread, pearls, beads"
                  className={inputClassName}
                  onChange={(event) =>
                    updateField(
                      "materials",
                      event.target.value,
                    )
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="primary-color"
                  className="text-sm font-medium"
                >
                  Primary color
                </label>

                <input
                  id="primary-color"
                  type="text"
                  value={
                    formData.primaryColor
                  }
                  placeholder="Example: Red"
                  className={inputClassName}
                  onChange={(event) =>
                    updateField(
                      "primaryColor",
                      event.target.value,
                    )
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="secondary-color"
                  className="text-sm font-medium"
                >
                  Secondary color
                </label>

                <input
                  id="secondary-color"
                  type="text"
                  value={
                    formData.secondaryColor
                  }
                  placeholder="Example: Gold"
                  className={inputClassName}
                  onChange={(event) =>
                    updateField(
                      "secondaryColor",
                      event.target.value,
                    )
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="dimensions"
                  className="text-sm font-medium"
                >
                  Size or dimensions
                </label>

                <input
                  id="dimensions"
                  type="text"
                  value={formData.dimensions}
                  placeholder="Example: Adjustable, 12 inches long"
                  className={inputClassName}
                  onChange={(event) =>
                    updateField(
                      "dimensions",
                      event.target.value,
                    )
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="occasion"
                  className="text-sm font-medium"
                >
                  Occasion
                </label>

                <input
                  id="occasion"
                  type="text"
                  value={formData.occasion}
                  placeholder="Example: Raksha Bandhan, wedding, birthday"
                  className={inputClassName}
                  onChange={(event) =>
                    updateField(
                      "occasion",
                      event.target.value,
                    )
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="price"
                  className="text-sm font-medium"
                >
                  Price
                </label>

                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>

                  <input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    placeholder="0.00"
                    className="h-10 w-full rounded-xl border bg-background pl-7 pr-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/30"
                    onChange={(event) =>
                      updateField(
                        "price",
                        event.target.value,
                      )
                    }
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="quantity"
                  className="text-sm font-medium"
                >
                  Quantity available
                </label>

                <input
                  id="quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.quantity}
                  className={inputClassName}
                  onChange={(event) =>
                    updateField(
                      "quantity",
                      event.target.value,
                    )
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="personalization"
                  className="text-sm font-medium"
                >
                  Personalization
                </label>

                <select
                  id="personalization"
                  value={
                    formData.personalization
                  }
                  className={inputClassName}
                  onChange={(event) =>
                    updateField(
                      "personalization",
                      event.target.value,
                    )
                  }
                >
                  <option value="no">
                    Not available
                  </option>

                  <option value="optional">
                    Optional
                  </option>

                  <option value="required">
                    Required
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="production-time"
                  className="text-sm font-medium"
                >
                  Production time
                </label>

                <input
                  id="production-time"
                  type="text"
                  value={
                    formData.productionTime
                  }
                  placeholder="Example: Ready to ship or 3–5 business days"
                  className={inputClassName}
                  onChange={(event) =>
                    updateField(
                      "productionTime",
                      event.target.value,
                    )
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

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

        <Card>
          <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">
                Ready to build your listing?
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Generate an editable title,
                description, 13 tags, materials,
                highlights, and image plan.
              </p>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={
                isGenerating ||
                isLoadingProject ||
                !canGenerate
              }
              className="w-full sm:w-auto"
            >
              {isGenerating ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Generating listing…
                </>
              ) : generatedListing ? (
                <>
                  <Sparkles className="size-4" />
                  Regenerate listing
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Generate listing
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>

      {generatedListing ? (
        <div
          id="generated-listing-package"
          className="scroll-mt-6 space-y-6"
        >
            <Card>
              <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">
                    Save your edits
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Save changes to the product details,
                    title, description, tags, materials,
                    highlights, and image plan.
                  </p>
                </div>

                <Button
                  type="button"
                  size="lg"
                  disabled={
                    isSaving ||
                    isGenerating ||
                    isLoadingProject ||
                    !projectId
                  }
                  className="w-full sm:w-auto"
                  onClick={() =>
                    void saveListingChanges()
                  }
                >
                  {isSaving ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      Saving changes…
                    </>
                  ) : (
                    <>
                      <Save className="size-4" />
                      Save changes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Generated listing package
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Review and edit all generated
              content before using it on Etsy.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                SEO listing title
              </CardTitle>

              <CardDescription>
                Etsy listing titles can contain
                up to 140 characters.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <textarea
                value={generatedListing.title}
                maxLength={140}
                rows={3}
                className={textareaClassName}
                onChange={(event) =>
                  updateGeneratedText(
                    "title",
                    event.target.value,
                  )
                }
              />

              <p className="mt-1 text-right text-xs text-muted-foreground">
                {generatedListing.title.length}
                /140
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Listing description
              </CardTitle>

              <CardDescription>
                Edit product details, formatting,
                care information, and buyer-facing
                wording.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <textarea
                value={
                  generatedListing.description
                }
                rows={16}
                className={textareaClassName}
                onChange={(event) =>
                  updateGeneratedText(
                    "description",
                    event.target.value,
                  )
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Etsy tags
              </CardTitle>

              <CardDescription>
                Exactly 13 tags are generated.
                Each tag must remain 20 characters
                or fewer.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {generatedListing.tags.map(
                  (tag, index) => (
                    <div
                      key={`tag-${index}`}
                    >
                      <label
                        htmlFor={`generated-tag-${index}`}
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Tag {index + 1}
                      </label>

                      <input
                        id={`generated-tag-${index}`}
                        type="text"
                        maxLength={20}
                        value={tag}
                        className={inputClassName}
                        onChange={(event) =>
                          updateGeneratedArrayItem(
                            "tags",
                            index,
                            event.target.value,
                          )
                        }
                      />

                      <p className="mt-1 text-right text-xs text-muted-foreground">
                        {tag.length}/20
                      </p>
                    </div>
                  ),
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  Materials
                </CardTitle>

                <CardDescription>
                  Confirm every material is
                  accurate before publishing.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {generatedListing.materials
                  .length > 0 ? (
                  generatedListing.materials.map(
                    (material, index) => (
                      <input
                        key={`material-${index}`}
                        type="text"
                        value={material}
                        className={inputClassName}
                        onChange={(event) =>
                          updateGeneratedArrayItem(
                            "materials",
                            index,
                            event.target.value,
                          )
                        }
                      />
                    ),
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No materials were generated
                    because materials were not
                    clearly provided.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  Product highlights
                </CardTitle>

                <CardDescription>
                  Key buyer-facing features from
                  the supplied product details.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {generatedListing.highlights.map(
                  (highlight, index) => (
                    <textarea
                      key={`highlight-${index}`}
                      value={highlight}
                      rows={2}
                      className={textareaClassName}
                      onChange={(event) =>
                        updateGeneratedArrayItem(
                          "highlights",
                          index,
                          event.target.value,
                        )
                      }
                    />
                  ),
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                Six-image listing plan
              </CardTitle>

              <CardDescription>
                These concepts will guide the
                image generator in the next phase.
                No images have been generated yet.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {generatedListing.imagePlan.map(
                  (imagePlanItem, index) => (
                    <article
                      key={imagePlanItem.id}
                      className="space-y-4 rounded-xl border p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">
                            Image {index + 1}
                          </p>

                          <p className="text-xs capitalize text-muted-foreground">
                            {imagePlanItem.type}
                          </p>
                        </div>

                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                          {imagePlanItem.type}
                        </span>
                      </div>

                      <div>
                        <label className="text-sm font-medium">
                          Image title
                        </label>

                        <input
                          type="text"
                          value={
                            imagePlanItem.title
                          }
                          className={inputClassName}
                          onChange={(event) =>
                            updateImagePlanItem(
                              index,
                              "title",
                              event.target.value,
                            )
                          }
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">
                          Concept description
                        </label>

                        <textarea
                          value={
                            imagePlanItem.description
                          }
                          rows={3}
                          className={
                            textareaClassName
                          }
                          onChange={(event) =>
                            updateImagePlanItem(
                              index,
                              "description",
                              event.target.value,
                            )
                          }
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">
                          AI generation instructions
                        </label>

                        <textarea
                          value={
                            imagePlanItem.generationInstructions
                          }
                          rows={6}
                          className={
                            textareaClassName
                          }
                          onChange={(event) =>
                            updateImagePlanItem(
                              index,
                              "generationInstructions",
                              event.target.value,
                            )
                          }
                        />
                      </div>
                    </article>
                  ),
                )}
              </div>
            </CardContent>
          </Card>

          {uploadedImages[0] ? (
            <ListingImageGenerator
              projectId={projectId}
              sourceImage={uploadedImages[0].file}
              productTitle={generatedListing.title}
              productDescription={
                generatedListing.description
              }
              imagePlan={generatedListing.imagePlan}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="rounded-xl border border-dashed p-6 text-center">
                  <ImageIcon className="mx-auto size-8 text-muted-foreground" />
          
                  <p className="mt-3 font-medium">
                    Primary product image unavailable
                  </p>
          
                  <p className="mt-1 text-sm text-muted-foreground">
                    Upload at least one original product
                    photo before generating listing images.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          <EtsyExportPanel
              projectId={projectId}
            />
        </div>
      ) : null}
    </div>
  );
}