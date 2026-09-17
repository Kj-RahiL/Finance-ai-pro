"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui";
import type { useMonthNav } from "../hooks";

type MonthNav = ReturnType<typeof useMonthNav>;

export function MonthPicker({ nav }: { nav: MonthNav }) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nav.prev} aria-label="Previous month">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <button
        type="button"
        onClick={nav.reset}
        className="tnum min-w-[8.5rem] px-1 text-center text-sm font-medium text-fg hover:text-accent"
        title={nav.isCurrent ? "Current month" : "Back to this month"}
      >
        {nav.label}
      </button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nav.next} disabled={!nav.canGoNext} aria-label="Next month">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
