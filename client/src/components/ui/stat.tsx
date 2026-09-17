import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card } from "./card";
import { Skeleton } from "./feedback";

interface StatProps {
  label: string;
  value?: string;
  sub?: string;
  icon: LucideIcon;
  tone?: "neutral" | "success" | "danger" | "accent";
  loading?: boolean;
}

const toneStyles = {
  neutral: { icon: "bg-surface-3 text-fg-muted", value: "text-fg" },
  success: { icon: "bg-success/15 text-success", value: "text-success" },
  danger: { icon: "bg-danger/15 text-danger", value: "text-danger" },
  accent: { icon: "bg-accent/15 text-accent", value: "text-fg" },
};

/** KPI tile: icon, label, big tabular number, optional footnote. */
export function Stat({ label, value, sub, icon: Icon, tone = "neutral", loading = false }: StatProps) {
  const t = toneStyles[tone];
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-fg-muted">{label}</p>
        <span className={cn("grid h-8 w-8 place-items-center rounded-lg", t.icon)}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      {loading || value === undefined ? (
        <Skeleton className="mt-3 h-7 w-28" />
      ) : (
        <p className={cn("tnum mt-2 truncate text-xl font-semibold tracking-tight sm:text-2xl", t.value)}>{value}</p>
      )}
      {sub && <p className="mt-1 text-xs text-fg-subtle">{sub}</p>}
    </Card>
  );
}
