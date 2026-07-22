"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & {
    digest?: string;
  };
  unstable_retry: () => void;
};

export default function GlobalError({
  error,
  unstable_retry,
}: GlobalErrorProps) {
  useEffect(() => {
    console.error(
      "SellerOS global error:",
      error,
    );
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          backgroundColor: "#f8fafc",
          color: "#0f172a",
          fontFamily:
            "Arial, Helvetica, sans-serif",
        }}
      >
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            boxSizing: "border-box",
          }}
        >
          <section
            style={{
              width: "100%",
              maxWidth: "560px",
              border: "1px solid #fecaca",
              borderRadius: "16px",
              backgroundColor: "#ffffff",
              padding: "32px",
              boxSizing: "border-box",
              textAlign: "center",
              boxShadow:
                "0 10px 30px rgba(15, 23, 42, 0.08)",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width: "52px",
                height: "52px",
                margin: "0 auto",
                borderRadius: "9999px",
                backgroundColor: "#fef2f2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                fontWeight: 700,
              }}
            >
              !
            </div>

            <h1
              style={{
                marginTop: "20px",
                marginBottom: "8px",
                fontSize: "26px",
              }}
            >
              SellerOS could not load
            </h1>

            <p
              style={{
                margin: 0,
                color: "#64748b",
                lineHeight: 1.6,
              }}
            >
              An unexpected application error occurred.
              Retry the request or return to the
              dashboard.
            </p>

            <div
              style={{
                marginTop: "24px",
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "12px",
              }}
            >
              <button
                type="button"
                onClick={unstable_retry}
                style={{
                  border: 0,
                  borderRadius: "8px",
                  backgroundColor: "#0f172a",
                  color: "#ffffff",
                  padding: "11px 18px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Try Again
              </button>

              <a
                href="/dashboard"
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  backgroundColor: "#ffffff",
                  color: "#0f172a",
                  padding: "10px 18px",
                  fontSize: "14px",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Return to Dashboard
              </a>
            </div>

            {error.digest && (
              <p
                style={{
                  marginTop: "22px",
                  marginBottom: 0,
                  color: "#94a3b8",
                  fontSize: "12px",
                }}
              >
                Error reference: {error.digest}
              </p>
            )}
          </section>
        </main>
      </body>
    </html>
  );
}