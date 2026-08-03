"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LoaderCircle,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AuthMode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] =
    useState<AuthMode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    if (!normalizedEmail) {
      toast.error("Enter your email address.");
      return;
    }

    if (password.length < 6) {
      toast.error(
        "Password must contain at least 6 characters.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase =
        createSupabaseBrowserClient();

      if (mode === "signup") {
        const { data, error } =
          await supabase.auth.signUp({
            email: normalizedEmail,
            password,
          });

        if (error) {
          throw error;
        }

        if (!data.session) {
          toast.success(
            "Account created. Check your email to confirm your account.",
          );
          return;
        }

        toast.success(
          "Your SellerOS account was created.",
        );
      } else {
        const { error } =
          await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });

        if (error) {
          throw error;
        }

        toast.success("Welcome back to SellerOS.");
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Authentication failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setPassword("");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-5" />
          </div>

          <div>
            <p className="text-xl font-bold">
              SellerOS AI
            </p>

            <p className="text-sm text-muted-foreground">
              Etsy growth operating system
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex size-11 items-center justify-center rounded-full bg-muted">
              <LockKeyhole className="size-5" />
            </div>

            <CardTitle>
              {mode === "login"
                ? "Log in to SellerOS"
                : "Create your SellerOS account"}
            </CardTitle>

            <CardDescription>
              {mode === "login"
                ? "Access your connected shop, listing insights, and optimization tools."
                : "Create an account to protect your shop data and SellerOS workspace."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form
              className="space-y-4"
              onSubmit={handleSubmit}
            >
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={isSubmitting}
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  autoComplete={
                    mode === "login"
                      ? "current-password"
                      : "new-password"
                  }
                  required
                  minLength={6}
                  disabled={isSubmitting}
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="At least 6 characters"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />

                    {mode === "login"
                      ? "Logging in…"
                      : "Creating account…"}
                  </>
                ) : mode === "login" ? (
                  "Log in"
                ) : (
                  "Create account"
                )}
              </Button>
            </form>

            <div className="mt-6 border-t pt-5 text-center">
              <p className="text-sm text-muted-foreground">
                {mode === "login"
                  ? "New to SellerOS?"
                  : "Already have an account?"}
              </p>

              <Button
                type="button"
                variant="link"
                disabled={isSubmitting}
                onClick={() =>
                  changeMode(
                    mode === "login"
                      ? "signup"
                      : "login",
                  )
                }
              >
                {mode === "login"
                  ? "Create an account"
                  : "Log in instead"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}