"use client";

import { motion } from "framer-motion";

import { formatDate, formatSigned } from "@/lib/format";
import type { Account, Transaction } from "@/lib/types";
import { Badge, Button, cn } from "@/components/ui";

interface TransactionRowProps {
  txn: Transaction;
  account?: Account;
  onEdit?: (txn: Transaction) => void;
  onDelete?: (txn: Transaction) => void;
}

export function TransactionRow({ txn, account, onEdit, onDelete }: TransactionRowProps) {
  const isIncome = txn.type === "income";
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="group flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3"
    >
      <div className="min-w-0">
        <p className="truncate font-medium text-slate-100">{txn.description}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>{formatDate(txn.date)}</span>
          {account && <span>· {account.name}</span>}
          {txn.category && (
            <Badge>
              <span aria-hidden>{txn.category.icon}</span>
              {txn.category.name}
            </Badge>
          )}
          {/* Distinguish AI-generated from user-confirmed data (blueprint §12). */}
          {txn.ai_suggested && <Badge tone="ai">✨ AI suggested</Badge>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <span className={cn("font-semibold", isIncome ? "text-emerald-400" : "text-slate-200")}>
          {formatSigned(txn.amount, txn.type, account?.currency)}
        </span>
        {(onEdit || onDelete) && (
          <div className="ml-2 flex gap-1 opacity-60 transition group-hover:opacity-100">
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(txn)} aria-label="Edit transaction">
                Edit
              </Button>
            )}
            {onDelete && (
              <Button variant="danger" size="sm" onClick={() => onDelete(txn)} aria-label="Delete transaction">
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.li>
  );
}
