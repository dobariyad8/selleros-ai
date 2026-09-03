"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

export type SellerOSSubscription = {
  planKey: string;
  status: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  cancelAt: string | null;
  canceledAt: string | null;
  canStartCheckout: boolean;
  canManageBilling: boolean;
};

type SubscriptionResponse = {
  success: boolean;
  subscription?: SellerOSSubscription;
  error?: string;
};

export function useSubscription() {
  const [
    subscription,
    setSubscription,
  ] = useState<SellerOSSubscription | null>(
    null,
  );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const refreshSubscription =
    useCallback(async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          "/api/stripe/subscription",
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const data =
          (await response.json()) as SubscriptionResponse;

        if (
          !response.ok ||
          !data.success ||
          !data.subscription
        ) {
          throw new Error(
            data.error ??
              "Could not load subscription.",
          );
        }

        setSubscription(
          data.subscription,
        );
      } catch (loadError) {
        setSubscription(null);

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load subscription.",
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshSubscription();
  }, [refreshSubscription]);

  const hasProAccess =
    subscription?.planKey === "pro" &&
    ["active", "trialing"].includes(
      subscription.status,
    );

  return {
    subscription,
    hasProAccess,
    isLoading,
    error,
    refreshSubscription,
  };
}