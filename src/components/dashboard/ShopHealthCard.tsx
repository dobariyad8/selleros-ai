import {
  CircleAlert,
  CircleCheck,
  HeartPulse,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type HealthScore = {
  name: string;
  score: number;
};

type ShopHealthCardProps = {
  overallScore: number;
  scores: HealthScore[];
};

function getScoreLabel(score: number) {
  if (score >= 85) {
    return "Excellent";
  }

  if (score >= 70) {
    return "Needs attention";
  }

  return "Needs improvement";
}

function getBadgeVariant(score: number) {
  if (score >= 85) {
    return "default" as const;
  }

  if (score >= 70) {
    return "secondary" as const;
  }

  return "destructive" as const;
}

function ScoreStatusIcon({ score }: { score: number }) {
  if (score >= 85) {
    return <CircleCheck className="size-4" />;
  }

  return <CircleAlert className="size-4" />;
}

export default function ShopHealthCard({
  overallScore,
  scores,
}: ShopHealthCardProps) {
  return (
    <Card className="h-full transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <HeartPulse className="size-5" />
              Shop Health Score
            </CardTitle>

            <CardDescription className="mt-1">
              A summary of your Etsy listing quality.
            </CardDescription>
          </div>

          <Badge variant="outline" className="gap-1">
            <TrendingUp className="size-3" />
            Updated today
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-6 flex items-end justify-between rounded-xl border bg-muted/30 p-4">
          <div>
            <p className="text-4xl font-bold tracking-tight">
              {overallScore}
              <span className="text-lg font-medium text-muted-foreground">
                /100
              </span>
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Overall shop health
            </p>
          </div>

          <Badge variant={getBadgeVariant(overallScore)}>
            {getScoreLabel(overallScore)}
          </Badge>
        </div>

        <div className="space-y-5">
          {scores.map((item) => (
            <div key={item.name}>
              <div className="mb-2 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{item.name}</p>

                  <p className="text-xs text-muted-foreground">
                    Listing quality score
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">
                    {item.score}/100
                  </span>

                  <Badge
                    variant={getBadgeVariant(item.score)}
                    className="gap-1"
                  >
                    <ScoreStatusIcon score={item.score} />
                    {getScoreLabel(item.score)}
                  </Badge>
                </div>
              </div>

              <Progress value={item.score} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}