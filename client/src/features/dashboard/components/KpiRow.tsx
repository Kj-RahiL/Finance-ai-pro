"use client";

import { ArrowDownRight, ArrowUpRight, Scale, Wallet } from "lucide-react";

import { formatMoney } from "@/lib/format";
import type { MonthlySummary } from "@/lib/types";
import { Stat } from "@/components/ui";

interface KpiRowProps {
  summary?: MonthlySummary;
  isLoading: boolean;
}

/** The cash-flow summary — the one widget the blueprint says must be above the fold. */
export function KpiRow({ summary, isLoading }: KpiRowProps) {
  const s = summary;
  const money = (v?: number) => (v === undefined ? undefined : formatMoney(v));

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat label="Total balance" value={money(s?.total_balance)} sub="Across active accounts" icon={Wallet} tone="accent" loading={isLoading} />
      <Stat label="Income" value={money(s?.income)} sub="This month" icon={ArrowUpRight} tone="success" loading={isLoading} />
      <Stat label="Expenses" value={money(s?.expense)} sub="This month" icon={ArrowDownRight} tone="danger" loading={isLoading} />
      <Stat
        label="Net"
        value={money(s?.net)}
        sub={s ? (s.net >= 0 ? "You saved money" : "Spent more than earned") : undefined}
        icon={Scale}
        tone={s && s.net < 0 ? "danger" : "neutral"}
        loading={isLoading}
      />
    </div>
  );
}
