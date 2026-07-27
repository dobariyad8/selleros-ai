"use client";

import { Sparkles } from "lucide-react";

type AIInsightProps = {
  title?: string;
  message: string;
};

export default function AIInsight({
  title = "AI Insight",
  message,
}: AIInsightProps) {
  return (
    <div className="mt-5 flex items-start gap-3 rounded-xl border bg-muted/20 p-3">
      <Sparkles className="mt-0.5 size-4 shrink-0" />

      <div className="min-w-0">
        <p className="text-xs font-semibold">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {message}
        </p>
      </div>
    </div>
  );
}