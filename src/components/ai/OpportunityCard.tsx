type OpportunityCardProps = {
  title: string;
  impact: string;
  effort: string;
  recommendation: string;
};

export default function OpportunityCard({
  title,
  impact,
  effort,
  recommendation,
}: OpportunityCardProps) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {title}
        </h3>

        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
          {impact}
        </span>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        <strong>Estimated effort:</strong> {effort}
      </p>

      <p className="mt-4 text-sm">
        {recommendation}
      </p>
    </div>
  );
}