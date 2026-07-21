type ScoreComparisonProps = {
  label: string;
  currentScore: number;
  suggestedScore: number | null;
  nonImprovementMessage: string;
};

export default function ScoreComparison({
  label,
  currentScore,
  suggestedScore,
  nonImprovementMessage,
}: ScoreComparisonProps) {
  if (suggestedScore === null) {
    return null;
  }

  const scoreChange =
    suggestedScore - currentScore;

  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <p className="text-sm font-medium">
        Estimated {label}-score improvement
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="rounded-md border bg-background px-3 py-2">
          <p className="text-xs text-muted-foreground">
            Current
          </p>

          <p className="text-lg font-semibold">
            {currentScore}/100
          </p>
        </div>

        <span className="text-muted-foreground">
          →
        </span>

        <div className="rounded-md border bg-background px-3 py-2">
          <p className="text-xs text-muted-foreground">
            Suggested
          </p>

          <p className="text-lg font-semibold">
            {suggestedScore}/100
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            scoreChange > 0
              ? "bg-emerald-100 text-emerald-700"
              : scoreChange < 0
                ? "bg-red-100 text-red-700"
                : "bg-muted text-muted-foreground"
          }`}
        >
          {scoreChange > 0 ? "+" : ""}
          {scoreChange} points
        </span>
      </div>

      {scoreChange <= 0 && (
        <p className="mt-3 text-sm text-amber-700">
          {nonImprovementMessage}
        </p>
      )}
    </div>
  );
}