interface AuditScoreCardProps {
  title: string;
  score: number;
  onClick?: () => void;
}

function getScoreColor(score: number) {
  if (score >= 85) {
    return "text-emerald-600";
  }

  if (score >= 70) {
    return "text-yellow-600";
  }

  return "text-red-600";
}

function getProgressColor(score: number) {
  if (score >= 85) {
    return "bg-emerald-500";
  }

  if (score >= 70) {
    return "bg-yellow-500";
  }

  return "bg-red-500";
}

export default function AuditScoreCard({
  title,
  score,
  onClick,
}: AuditScoreCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="min-w-0 w-full rounded-xl border bg-card p-4 text-left transition hover:border-primary hover:shadow-md disabled:cursor-default disabled:hover:border-border disabled:hover:shadow-none sm:p-5"
    >
      <div className="flex min-w-0 items-center justify-between gap-3">
        <h3 className="min-w-0 wrap-break-words font-medium">
          {title}
        </h3>

        <span
          className={`shrink-0 text-xl font-bold sm:text-2xl ${getScoreColor(
            score,
          )}`}
        >
          {score}
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full transition-[width] ${getProgressColor(
            score,
          )}`}
          style={{
            width: `${Math.min(
              Math.max(score, 0),
              100,
            )}%`,
          }}
        />
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Score out of 100
      </p>
    </button>
  );
}