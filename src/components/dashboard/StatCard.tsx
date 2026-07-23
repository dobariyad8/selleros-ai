import type { LucideIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type StatCardProps = {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
};

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: StatCardProps) {
  return (
    <Card className="min-w-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 px-4 pb-2 pt-4 sm:px-6 sm:pt-6">
        <CardTitle className="min-w-0 wrap-break-words text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>

        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-4" />
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
        <p className="wrap-break-words text-xl font-bold sm:text-2xl">{value}</p>

        <p className="mt-1 wrap-break-words text-xs text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}