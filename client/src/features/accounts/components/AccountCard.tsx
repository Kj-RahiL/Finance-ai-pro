"use client";

import { motion } from "framer-motion";

import { ACCOUNT_TYPE_LABELS, formatMoney } from "@/lib/format";
import type { Account } from "@/lib/types";
import { Badge, Button, cn } from "@/components/ui";

const ICONS: Record<Account["type"], string> = {
  cash: "💵",
  bank: "🏦",
  credit: "💳",
  mobile: "📱",
  savings: "🐷",
};

interface AccountCardProps {
  account: Account;
  onEdit?: (account: Account) => void;
  onArchive?: (account: Account) => void;
  onRestore?: (account: Account) => void;
}

export function AccountCard({ account, onEdit, onArchive, onRestore }: AccountCardProps) {
  const negative = account.balance < 0;
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={cn(
        "flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3",
        account.is_archived && "opacity-60",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="text-2xl" aria-hidden>
          {ICONS[account.type]}
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-100">{account.name}</p>
          <div className="mt-1 flex items-center gap-2">
            <Badge>{ACCOUNT_TYPE_LABELS[account.type]}</Badge>
            {account.is_archived && <Badge tone="muted">Archived</Badge>}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 pl-3">
        <span className={cn("font-semibold", negative ? "text-rose-300" : "text-slate-100")}>
          {formatMoney(account.balance, account.currency)}
        </span>
        {onEdit && !account.is_archived && (
          <Button variant="ghost" size="sm" onClick={() => onEdit(account)}>
            Edit
          </Button>
        )}
        {onArchive && !account.is_archived && (
          <Button variant="danger" size="sm" onClick={() => onArchive(account)}>
            Archive
          </Button>
        )}
        {onRestore && account.is_archived && (
          <Button variant="ghost" size="sm" onClick={() => onRestore(account)}>
            Restore
          </Button>
        )}
      </div>
    </motion.li>
  );
}
