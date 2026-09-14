"use client";

import { AnimatePresence } from "framer-motion";

import type { Account, Transaction } from "@/lib/types";
import { EmptyState, Spinner } from "@/components/ui";
import { TransactionRow } from "./TransactionRow";

interface TransactionListProps {
  transactions: Transaction[];
  accounts: Account[];
  isLoading: boolean;
  isError: boolean;
  emptyMessage?: string;
  onEdit?: (txn: Transaction) => void;
  onDelete?: (txn: Transaction) => void;
}

export function TransactionList({
  transactions,
  accounts,
  isLoading,
  isError,
  emptyMessage = "No transactions yet. Add your first one above.",
  onEdit,
  onDelete,
}: TransactionListProps) {
  if (isLoading) {
    return (
      <div className="grid place-items-center py-12 text-slate-500">
        <Spinner />
      </div>
    );
  }
  if (isError) return <p className="py-8 text-center text-rose-400">Couldn&apos;t load transactions.</p>;
  if (transactions.length === 0) return <EmptyState>{emptyMessage}</EmptyState>;

  const accountById = new Map(accounts.map((a) => [a.id, a]));
  return (
    <ul className="space-y-2">
      <AnimatePresence initial={false}>
        {transactions.map((txn) => (
          <TransactionRow
            key={txn.id}
            txn={txn}
            account={accountById.get(txn.account_id)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </AnimatePresence>
    </ul>
  );
}
