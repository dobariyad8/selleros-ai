"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DashboardErrorProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function DashboardError({
  error,
  reset,
}: DashboardErrorProps) {
  useEffect(() => {
    console.error(
      "SellerOS dashboard error:",
      error,
    );
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl items-center justify-center">
      <Card className="w-full border-red-200">
        <CardHeader className="text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-red-50">
            <TriangleAlert className="size-6 text-red-600" />
          </div>

          <CardTitle className="mt-3">
            Something went wrong
          </CardTitle>

          <CardDescription>
            SellerOS encountered an unexpected problem
            while loading this page.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              type="button"
              onClick={reset}
            >
              <RefreshCw className="size-4" />
              Try Again
            </Button>

            <Button
              variant="outline"
              nativeButton={false}
              render={
                <Link href="/dashboard" />
              }
            >
              <LayoutDashboard className="size-4" />
              Return to Dashboard
            </Button>
          </div>

          {error.digest && (
            <p className="mt-5 text-center text-xs text-muted-foreground">
              Error reference: {error.digest}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}