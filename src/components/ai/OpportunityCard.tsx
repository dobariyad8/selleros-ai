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
    <div className="min-w-0 rounded-xl border bg-card p-4 shadow-sm sm:p-6">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h3 className="min-w-0 wrap-break-words text-base font-semibold sm:text-lg">
          {title}
        </h3>

        <span className="w-fit shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
          {impact}
        </span>
      </div>

      <p className="mt-4 wrap-break-words text-sm text-muted-foreground">
        <strong className="font-medium text-foreground">
          Estimated effort:
        </strong>{" "}
        {effort}
      </p>

      <p className="mt-4 wrap-break-words text-sm leading-6">
        {recommendation}
      </p>
    </div>
  );
}