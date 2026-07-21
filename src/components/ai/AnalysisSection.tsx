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
    <div className="rounded-xl border bg-card p-6">
      <h2 className="text-lg font-semibold">
        {title}
      </h2>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="font-medium text-emerald-600">
            Strengths
          </h3>

          {result.strengths.length > 0 ? (
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
              {result.strengths.map((strength) => (
                <li key={strength}>{strength}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              No strengths detected yet.
            </p>
          )}
        </div>

        <div>
          <h3 className="font-medium text-red-600">
            Weaknesses
          </h3>

          {result.weaknesses.length > 0 ? (
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
              {result.weaknesses.map((weakness) => (
                <li key={weakness}>{weakness}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              No weaknesses detected.
            </p>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="font-medium">
          Recommendations
        </h3>

        {result.recommendations.length > 0 ? (
          <div className="mt-4 space-y-4">
            {result.recommendations.map((recommendation) => (
              <div
                key={recommendation.title}
                className="rounded-lg border p-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">
                    {recommendation.title}
                  </h4>

                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs capitalize">
                    {recommendation.impact}
                  </span>
                </div>

                <p className="mt-2 text-sm text-muted-foreground">
                  {recommendation.description}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            No recommendations at this time.
          </p>
        )}
      </div>
    </div>
  );
}