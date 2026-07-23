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
    <div className="grid min-w-0 gap-3 rounded-lg border p-3 sm:p-4 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
      <div className="min-w-0">
        <p className="wrap-break-words font-medium">
          {label}
        </p>

        <p className="mt-1 wrap-break-words text-xs text-muted-foreground">
          Estimated rule-based score
        </p>
      </div>

      <div className="grid min-w-0 grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="min-w-0 rounded-md bg-muted px-2 py-2 text-center sm:px-3">
          <p className="text-xs text-muted-foreground">
            Current
          </p>

          <p className="wrap-break-words font-semibold">
            {current}/100
          </p>
        </div>

        <ArrowRight className="size-4 shrink-0 text-muted-foreground" />

        <div className="min-w-0 rounded-md bg-muted px-2 py-2 text-center sm:px-3">
          <p className="text-xs text-muted-foreground">
            Projected
          </p>

          <p className="wrap-break-words font-semibold">
            {projected}/100
          </p>
        </div>
      </div>

      <div
        className={`flex w-fit shrink-0 items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${
          change > 0
            ? "bg-emerald-100 text-emerald-700"
            : change < 0
              ? "bg-red-100 text-red-700"
              : "bg-muted text-muted-foreground"
        }`}
      >
        {change > 0 ? (
          <TrendingUp className="size-4 shrink-0" />
        ) : change < 0 ? (
          <TrendingDown className="size-4 shrink-0" />
        ) : (
          <Minus className="size-4 shrink-0" />
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
    <div className="min-w-0 rounded-xl border bg-card p-4 shadow-sm sm:p-6">
      <div className="min-w-0">
        <h2 className="wrap-break-words text-base font-semibold sm:text-lg">
          Projected Optimization Impact
        </h2>

        <p className="mt-2 wrap-break-words text-sm leading-6 text-muted-foreground">
          Compare the current listing with the title,
          description, and tags currently shown in the AI
          editors.
        </p>
      </div>

      <div
        className={`mt-5 min-w-0 rounded-lg border p-3 sm:p-4 ${
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

        <p className="mt-1 wrap-break-words text-xl font-bold sm:text-2xl">
          {overallChange > 0 ? "+" : ""}
          {overallChange} points
        </p>

        <p className="mt-1 wrap-break-words text-xs leading-5 text-muted-foreground">
          This estimate is based on SellerOS scoring rules,
          not guaranteed Etsy traffic or sales.
        </p>
      </div>

      <div className="mt-5 min-w-0 space-y-3 sm:mt-6">
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