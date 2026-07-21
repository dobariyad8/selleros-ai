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
  const [generated, setGenerated] = useState(false);

  function generateSuggestion() {
    setGenerated(true);

    toast.success("AI image suggestion generated", {
      description:
        "A brighter, closer hero-image preview is ready.",
    });
  }

  function applyImage() {
    onApply();

    toast.success("AI hero image applied", {
      description:
        "The mock image improvement was added to the listing.",
    });
  }

  return (
    <Card className="xl:col-span-2">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="size-5" />
              Hero image optimization
            </CardTitle>

            <CardDescription className="mt-1">
              Compare the current listing image with an AI-improved preview.
            </CardDescription>
          </div>

          <Badge variant={isApplied ? "default" : "destructive"}>
            {isApplied ? "Applied" : "High impact"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium">
              Current hero image
            </p>

            <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted">
              <Image
                src={imageUrl}
                alt="Current listing hero image"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {issue}
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">
              AI-improved preview
            </p>

            <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-dashed bg-muted/40">
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
                      <Sparkles className="size-3" />
                      AI preview
                    </Badge>
                  </div>
                </>
              ) : (
                <div className="max-w-xs p-6 text-center">
                  <Sparkles className="mx-auto size-8 text-muted-foreground" />

                  <p className="mt-3 font-medium">
                    Generate an improved preview
                  </p>

                  <p className="mt-2 text-sm text-muted-foreground">
                    This mock preview will simulate brighter lighting
                    and a closer crop.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={generateSuggestion}
              >
                <Sparkles className="size-4" />
                {generated ? "Generate again" : "Generate preview"}
              </Button>

              <Button
                onClick={applyImage}
                disabled={!generated || isApplied}
              >
                <CheckCircle2 className="size-4" />
                {isApplied ? "Image applied" : "Apply image"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}