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
    <div className="min-w-0 rounded-lg border bg-muted/30 p-3 sm:p-4">
      <p className="wrap-break-words text-sm font-medium">
        Estimated {label}-score improvement
      </p>

      <div className="mt-3 grid min-w-0 grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="min-w-0 rounded-md border bg-background px-2 py-2 text-center sm:px-3">
          <p className="text-xs text-muted-foreground">
            Current
          </p>

          <p className="wrap-break-words text-base font-semibold sm:text-lg">
            {currentScore}/100
          </p>
        </div>

        <span className="shrink-0 text-muted-foreground">
          →
        </span>

        <div className="min-w-0 rounded-md border bg-background px-2 py-2 text-center sm:px-3">
          <p className="text-xs text-muted-foreground">
            Suggested
          </p>

          <p className="wrap-break-words text-base font-semibold sm:text-lg">
            {suggestedScore}/100
          </p>
        </div>
      </div>

      <span
        className={`mt-3 inline-flex w-fit max-w-full items-center rounded-full px-3 py-1 text-sm font-medium ${
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

      {scoreChange <= 0 && (
        <p className="mt-3 wrap-break-words text-sm leading-6 text-amber-700">
          {nonImprovementMessage}
        </p>
      )}
    </div>
  );
}