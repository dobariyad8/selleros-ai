import {
  ArrowRight,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

type OptimizationScores = {
  overall: number;
  title: number;
  tags: number;
  description: number;
};

type OptimizationImpactCardProps = {
  currentScores: OptimizationScores;
  projectedScores: OptimizationScores;
  isVisible: boolean;
};

type ScoreRowProps = {
  label: string;
  currentScore: number;
  projectedScore: number;
};

function clampScore(score: number) {
  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(0, Math.min(100, score));
}

function ScoreRow({
  label,
  currentScore,
  projectedScore,
}: ScoreRowProps) {
  const current = clampScore(currentScore);
  const projected = clampScore(projectedScore);
  const change = projected - current;

  return (
    <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
      <div>
        <p className="font-medium">{label}</p>

        <p className="mt-1 text-xs text-muted-foreground">
          Estimated rule-based score
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="min-w-20 rounded-md bg-muted px-3 py-2 text-center">
          <p className="text-xs text-muted-foreground">
            Current
          </p>

          <p className="font-semibold">
            {current}/100
          </p>
        </div>

        <ArrowRight className="size-4 text-muted-foreground" />

        <div className="min-w-20 rounded-md bg-muted px-3 py-2 text-center">
          <p className="text-xs text-muted-foreground">
            Projected
          </p>

          <p className="font-semibold">
            {projected}/100
          </p>
        </div>
      </div>

      <div
        className={`flex w-fit items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${
          change > 0
            ? "bg-emerald-100 text-emerald-700"
            : change < 0
              ? "bg-red-100 text-red-700"
              : "bg-muted text-muted-foreground"
        }`}
      >
        {change > 0 ? (
          <TrendingUp className="size-4" />
        ) : change < 0 ? (
          <TrendingDown className="size-4" />
        ) : (
          <Minus className="size-4" />
        )}

        {change > 0 ? "+" : ""}
        {change}
      </div>
    </div>
  );
}

export default function OptimizationImpactCard({
  currentScores,
  projectedScores,
  isVisible,
}: OptimizationImpactCardProps) {
  if (!isVisible) {
    return null;
  }

  const overallChange =
    projectedScores.overall -
    currentScores.overall;

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold">
          Projected Optimization Impact
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Compare the current listing with the title,
          description, and tags currently shown in the AI
          editors.
        </p>
      </div>

      <div
        className={`mt-5 rounded-lg border p-4 ${
          overallChange > 0
            ? "border-emerald-200 bg-emerald-50"
            : overallChange < 0
              ? "border-red-200 bg-red-50"
              : "bg-muted/30"
        }`}
      >
        <p className="text-sm font-medium">
          Overall projected change
        </p>

        <p className="mt-1 text-2xl font-bold">
          {overallChange > 0 ? "+" : ""}
          {overallChange} points
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          This estimate is based on SellerOS scoring rules,
          not guaranteed Etsy traffic or sales.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        <ScoreRow
          label="Overall listing"
          currentScore={currentScores.overall}
          projectedScore={projectedScores.overall}
        />

        <ScoreRow
          label="Title"
          currentScore={currentScores.title}
          projectedScore={projectedScores.title}
        />

        <ScoreRow
          label="Tags"
          currentScore={currentScores.tags}
          projectedScore={projectedScores.tags}
        />

        <ScoreRow
          label="Description"
          currentScore={currentScores.description}
          projectedScore={
            projectedScores.description
          }
        />
      </div>
    </div>
  );
}