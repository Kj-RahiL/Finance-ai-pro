"use client";

import { formatMoney, monthLabel } from "@/lib/format";
import type { MonthlySummary } from "@/lib/types";
import { Card, cn } from "@/components/ui";

interface SummaryCardsProps {
  summary?: MonthlySummary;
  isLoading: boolean;
}

/** The cash-flow summary — the one widget the blueprint says must be above the fold. */
export function SummaryCards({ summary, isLoading }: SummaryCardsProps) {
  const tiles = [
    { label: "Total balance", value: summary?.total_balance, tone: "neutral" as const },
    { label: "Income", value: summary?.income, tone: "income" as const },
    { label: "Expense", value: summary?.expense, tone: "expense" as const },
    { label: "Net", value: summary?.net, tone: "net" as const },
  ];

  return (
    <div>
      {summary && (
        <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">
          {monthLabel(summary.year, summary.month)} · {summary.transaction_count} transactions
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((tile) => (
          <Card key={tile.label} className="p-4">
            <p className="text-xs font-medium text-slate-400">{tile.label}</p>
            <p
              className={cn(
                "mt-1 truncate text-lg font-semibold",
                tile.tone === "income" && "text-emerald-400",
                tile.tone === "expense" && "text-rose-300",
                tile.tone === "net" && (summary?.net ?? 0) < 0 ? "text-rose-300" : "text-slate-100",
              )}
            >
              {isLoading || tile.value === undefined ? (
                <span className="inline-block h-6 w-24 animate-pulse rounded bg-slate-800" />
              ) : (
                formatMoney(tile.value)
              )}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
