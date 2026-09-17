"use client";

import Link from "next/link";
import { PieChart } from "lucide-react";

import { formatMoney } from "@/lib/format";
import type { CategoryBreakdown as Breakdown } from "@/lib/types";
import { Card, CardBody, CardHeader, EmptyState, Skeleton } from "@/components/ui";

interface CategoryBreakdownProps {
  data?: Breakdown;
  isLoading: boolean;
}

/** Where the month's money went — ranked bars with share of total. */
export function CategoryBreakdown({ data, isLoading }: CategoryBreakdownProps) {
  return (
    <Card>
      <CardHeader
        title="Spending by category"
        description={data ? `${formatMoney(data.total_expense)} in expenses` : undefined}
      />
      <CardBody className="pt-4">
        {isLoading && !data ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9" />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <EmptyState icon={PieChart} title="No expenses this month" description="Add an expense and it will show up here, categorized." className="py-8" />
        ) : (
          <ul className="space-y-3">
            {data.items.map((item) => {
              const pct = Math.round(item.share * 100);
              return (
                <li key={item.category_id ?? "none"}>
                  <Link
                    href={item.category_id ? `/transactions?category_id=${item.category_id}&type=expense` : "/transactions?type=expense"}
                    className="group block"
                  >
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="text-base leading-none" aria-hidden>{item.icon}</span>
                        <span className="truncate font-medium text-fg group-hover:text-accent">{item.name}</span>
                        <span className="text-xs text-fg-subtle">{item.count}×</span>
                      </span>
                      <span className="tnum shrink-0 text-fg-muted">
                        {formatMoney(item.total)} <span className="text-fg-subtle">· {pct}%</span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-3">
                      <div className="h-full rounded-full bg-accent/80 transition-all" style={{ width: `${Math.max(pct, 2)}%` }} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
