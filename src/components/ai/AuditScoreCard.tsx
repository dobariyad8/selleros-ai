interface AuditScoreCardProps {
  title: string;
  score: number;
  onClick?: () => void;
}

function getScoreColor(score: number) {
  if (score >= 85) return "text-emerald-600";
  if (score >= 70) return "text-yellow-600";
  return "text-red-600";
}

function getProgressColor(score: number) {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 70) return "bg-yellow-500";
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
      className="w-full rounded-xl border bg-card p-5 text-left transition hover:shadow-md hover:border-primary"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{title}</h3>

        <span
          className={`text-2xl font-bold ${getScoreColor(score)}`}
        >
          {score}
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full ${getProgressColor(score)}`}
          style={{
            width: `${score}%`,
          }}
        />
      </div>
    </button>
  );
}