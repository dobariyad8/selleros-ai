"use client";

import Image from "next/image";
import { useState } from "react";
import {
  CheckCircle2,
  ImageIcon,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ImageOptimizerProps = {
  imageUrl: string;
  issue: string;
  onApply: () => void;
  isApplied: boolean;
};

export default function ImageOptimizer({
  imageUrl,
  issue,
  onApply,
  isApplied,
}: ImageOptimizerProps) {
  const [generated, setGenerated] =
    useState(false);

  function generateSuggestion() {
    setGenerated(true);

    toast.success(
      "AI image suggestion generated",
      {
        description:
          "A brighter, closer hero-image preview is ready.",
      },
    );
  }

  function applyImage() {
    onApply();

    toast.success("AI hero image applied", {
      description:
        "The mock image improvement was added to the listing.",
    });
  }

  return (
    <Card className="min-w-0 h-full">
      <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex min-w-0 items-center gap-2 text-base sm:text-lg">
              <ImageIcon className="size-5 shrink-0" />
              <span className="wrap-break-words">
                Hero image optimization
              </span>
            </CardTitle>

            <CardDescription className="mt-1 wrap-break-words">
              Compare the current listing image
              with an AI-improved preview.
            </CardDescription>
          </div>

          <Badge
            variant={
              isApplied
                ? "default"
                : "destructive"
            }
            className="w-fit shrink-0"
          >
            {isApplied
              ? "Applied"
              : "High impact"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
          <div className="min-w-0">
            <p className="mb-2 text-sm font-medium">
              Current hero image
            </p>

            <div className="relative aspect-square min-w-0 overflow-hidden rounded-xl border bg-muted">
              <Image
                src={imageUrl}
                alt="Current listing hero image"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>

            <p className="mt-3 wrap-break-words text-sm leading-6 text-muted-foreground">
              {issue}
            </p>
          </div>

          <div className="min-w-0">
            <p className="mb-2 text-sm font-medium">
              AI-improved preview
            </p>

            <div className="relative flex aspect-square min-w-0 items-center justify-center overflow-hidden rounded-xl border border-dashed bg-muted/40">
              {generated ? (
                <>
                  <Image
                    src={imageUrl}
                    alt="AI-improved hero image preview"
                    fill
                    className="scale-110 object-cover brightness-110 contrast-105"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />

                  <div className="absolute right-3 top-3">
                    <Badge className="gap-1">
                      <Sparkles className="size-3 shrink-0" />
                      AI preview
                    </Badge>
                  </div>
                </>
              ) : (
                <div className="max-w-xs p-4 text-center sm:p-6">
                  <Sparkles className="mx-auto size-8 text-muted-foreground" />

                  <p className="mt-3 font-medium">
                    Generate an improved preview
                  </p>

                  <p className="mt-2 wrap-break-words text-sm text-muted-foreground">
                    This mock preview will simulate
                    brighter lighting and a closer
                    crop.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={generateSuggestion}
              >
                <Sparkles className="size-4 shrink-0" />
                {generated
                  ? "Generate again"
                  : "Generate preview"}
              </Button>

              <Button
                className="w-full sm:w-auto"
                onClick={applyImage}
                disabled={!generated || isApplied}
              >
                <CheckCircle2 className="size-4 shrink-0" />
                {isApplied
                  ? "Image applied"
                  : "Apply image"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}