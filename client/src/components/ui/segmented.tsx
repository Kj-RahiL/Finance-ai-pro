"use client";

import { cn } from "@/lib/utils";

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; tone?: "success" | "danger" }[];
  className?: string;
  "aria-label"?: string;
}

/** Radio-like control for a small set of mutually exclusive choices (e.g. Expense / Income). */
export function Segmented<T extends string>({ value, onChange, options, className, ...aria }: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      {...aria}
      className={cn("grid h-10 rounded-lg border border-border bg-surface p-1", className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-md text-sm font-medium transition",
              active
                ? cn("bg-surface-3 text-fg shadow-sm", opt.tone === "success" && "text-success", opt.tone === "danger" && "text-danger")
                : "text-fg-muted hover:text-fg",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
