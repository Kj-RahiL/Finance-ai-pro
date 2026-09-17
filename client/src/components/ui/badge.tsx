import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "ai" | "success" | "danger" | "muted" | "outline";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-surface-3 text-fg-muted",
  ai: "border border-accent/40 bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  danger: "bg-danger/10 text-danger",
  muted: "bg-surface-2 text-fg-subtle",
  outline: "border border-border text-fg-muted",
};

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: BadgeTone; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-4", tones[tone], className)}>
      {children}
    </span>
  );
}
