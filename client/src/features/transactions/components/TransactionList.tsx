"use client";

import { AnimatePresence } from "framer-motion";
import { ArrowLeftRight } from "lucide-react";
import type { ReactNode } from "react";

import { formatSigned, relativeDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Account, Transaction } from "@/lib/types";
import { EmptyState, ListSkeleton } from "@/components/ui";
import { TransactionRow } from "./TransactionRow";

interface TransactionListProps {
  transactions: Transaction[];
  accounts: Account[];
  isLoading: boolean;
  isError: boolean;
  /** Group rows under date headers with a daily net (default on). */
  grouped?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  onEdit?: (txn: Transaction) => void;
  onDelete?: (txn: Transaction) => void;
}

function groupByDate(items: Transaction[]) {
  const groups = new Map<string, Transaction[]>();
  for (const t of items) {
    const list = groups.get(t.date);
    if (list) list.push(t);
    else groups.set(t.date, [t]);
  }
  return [...groups.entries()];
}

export function TransactionList({
  transactions,
  accounts,
  isLoading,
  isError,
  grouped = true,
  emptyTitle = "No transactions yet",
  emptyDescription = "Add your first one and the AI will file it for you.",
  emptyAction,
  onEdit,
  onDelete,
}: TransactionListProps) {
  if (isLoading) return <ListSkeleton rows={5} />;
  if (isError) return <p className="py-8 text-center text-sm text-danger">Couldn&apos;t load transactions.</p>;
  if (transactions.length === 0) {
    return <EmptyState icon={ArrowLeftRight} title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }

  const accountById = new Map(accounts.map((a) => [a.id, a]));
  const row = (txn: Transaction) => (
    <TransactionRow key={txn.id} txn={txn} account={accountById.get(txn.account_id)} onEdit={onEdit} onDelete={onDelete} />
  );

  if (!grouped) {
    return (
      <ul className="divide-y divide-border/60 rounded-2xl border border-border bg-surface/60">
        <AnimatePresence initial={false}>{transactions.map(row)}</AnimatePresence>
      </ul>
    );
  }

  return (
    <div className="space-y-5">
      {groupByDate(transactions).map(([date, items]) => {
        const net = items.reduce((sum, t) => sum + (t.type === "income" ? t.amount : -t.amount), 0);
        return (
          <section key={date}>
            <header className="mb-2 flex items-baseline justify-between px-1">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{relativeDay(date)}</h3>
              <span className={cn("tnum text-xs", net >= 0 ? "text-success" : "text-fg-subtle")}>
                {formatSigned(Math.abs(net), net >= 0 ? "income" : "expense")}
              </span>
            </header>
            <ul className="divide-y divide-border/60 rounded-2xl border border-border bg-surface/60">
              <AnimatePresence initial={false}>{items.map(row)}</AnimatePresence>
            </ul>
          </section>
        );
      })}
    </div>
  );
}
