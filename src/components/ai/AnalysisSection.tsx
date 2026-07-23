import type { ScoreResult } from "@/lib/scoring/types";

type AnalysisSectionProps = {
  title: string;
  result: ScoreResult;
};

export default function AnalysisSection({
  title,
  result,
}: AnalysisSectionProps) {
  return (
    <div className="min-w-0 rounded-xl border bg-card p-4 sm:p-6">
      <h2 className="wrap-break-words text-base font-semibold sm:text-lg">
        {title}
      </h2>

      <div className="mt-5 grid min-w-0 grid-cols-1 gap-5 sm:mt-6 sm:gap-6 md:grid-cols-2">
        <div className="min-w-0">
          <h3 className="font-medium text-emerald-600">
            Strengths
          </h3>

          {result.strengths.length > 0 ? (
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
              {result.strengths.map((strength) => (
                <li
                  key={strength}
                  className="wrap-break-words leading-6"
                >
                  {strength}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 wrap-break-words text-sm text-muted-foreground">
              No strengths detected yet.
            </p>
          )}
        </div>

        <div className="min-w-0">
          <h3 className="font-medium text-red-600">
            Weaknesses
          </h3>

          {result.weaknesses.length > 0 ? (
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
              {result.weaknesses.map((weakness) => (
                <li
                  key={weakness}
                  className="wrap-break-words leading-6"
                >
                  {weakness}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 wrap-break-words text-sm text-muted-foreground">
              No weaknesses detected.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 min-w-0 sm:mt-8">
        <h3 className="font-medium">
          Recommendations
        </h3>

        {result.recommendations.length > 0 ? (
          <div className="mt-4 min-w-0 space-y-3 sm:space-y-4">
            {result.recommendations.map(
              (recommendation) => (
                <div
                  key={recommendation.title}
                  className="min-w-0 rounded-lg border p-3 sm:p-4"
                >
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <h4 className="min-w-0 wrap-break-words font-medium">
                      {recommendation.title}
                    </h4>

                    <span className="w-fit shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs capitalize">
                      {recommendation.impact}
                    </span>
                  </div>

                  <p className="mt-2 wrap-break-words text-sm leading-6 text-muted-foreground">
                    {recommendation.description}
                  </p>
                </div>
              ),
            )}
          </div>
        ) : (
          <p className="mt-3 wrap-break-words text-sm text-muted-foreground">
            No recommendations at this time.
          </p>
        )}
      </div>
    </div>
  );
}