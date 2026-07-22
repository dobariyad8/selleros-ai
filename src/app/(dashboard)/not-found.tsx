import Link from "next/link";
import {
  ArrowLeft,
  FileQuestion,
  LayoutDashboard,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-muted">
            <FileQuestion className="size-7 text-muted-foreground" />
          </div>

          <p className="mt-4 text-sm font-semibold text-primary">
            Error 404
          </p>

          <CardTitle className="text-2xl">
            Page not found
          </CardTitle>

          <CardDescription className="mx-auto max-w-md">
            The SellerOS page you tried to open does not
            exist, may have moved, or is no longer
            available.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              nativeButton={false}
              render={<Link href="/dashboard" />}
            >
              <LayoutDashboard className="size-4" />
              Open Dashboard
            </Button>

            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/listings" />}
            >
              <ArrowLeft className="size-4" />
              View Listings
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}