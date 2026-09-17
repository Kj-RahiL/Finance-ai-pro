"use client";

import { motion } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";

import { formatSigned } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Account, Transaction } from "@/lib/types";
import { Button } from "@/components/ui";
import { CategoryMenu } from "./CategoryMenu";

interface TransactionRowProps {
  txn: Transaction;
  account?: Account;
  onEdit?: (txn: Transaction) => void;
  onDelete?: (txn: Transaction) => void;
}

export function TransactionRow({ txn, account, onEdit, onDelete }: TransactionRowProps) {
  const isIncome = txn.type === "income";
  const editable = Boolean(onEdit || onDelete);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      // Tapping the row edits (the only affordance on touch screens); buttons stop propagation.
      onClick={onEdit ? () => onEdit(txn) : undefined}
      className={cn("group flex items-center gap-3 px-4 py-3 transition first:rounded-t-2xl last:rounded-b-2xl hover:bg-surface-2/60", onEdit && "cursor-pointer")}
    >
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-lg text-lg",
          isIncome ? "bg-success/10" : "bg-surface-3",
        )}
        aria-hidden
      >
        {txn.category?.icon ?? "💰"}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-fg">{txn.description}</p>
        <div className="mt-1 flex items-center gap-x-2 text-xs text-fg-subtle">
          {editable ? (
            <CategoryMenu txn={txn} />
          ) : (
            txn.category && (
              <span className="text-fg-muted">
                {txn.category.icon} {txn.category.name}
              </span>
            )
          )}
          {account && <span className="hidden truncate sm:inline">{account.name}</span>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <span className={cn("tnum text-sm font-semibold", isIncome ? "text-success" : "text-fg")}>
          {formatSigned(txn.amount, txn.type, account?.currency)}
        </span>
        {editable && (
          <div className="ml-1 hidden opacity-40 transition group-hover:opacity-100 focus-within:opacity-100 sm:flex">
            {onEdit && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onEdit(txn); }} aria-label="Edit transaction">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button variant="danger" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onDelete(txn); }} aria-label="Delete transaction">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.li>
  );
}
