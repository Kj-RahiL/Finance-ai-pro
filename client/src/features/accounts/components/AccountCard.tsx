"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Archive, ArchiveRestore, ArrowUpRight, Banknote, CreditCard, Landmark, PiggyBank, Smartphone, Pencil } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { ACCOUNT_TYPE_LABELS, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Account } from "@/lib/types";
import { Badge, Button } from "@/components/ui";

export const ACCOUNT_ICONS: Record<Account["type"], LucideIcon> = {
  cash: Banknote,
  bank: Landmark,
  credit: CreditCard,
  mobile: Smartphone,
  savings: PiggyBank,
};

const ACCOUNT_TINTS: Record<Account["type"], string> = {
  cash: "bg-success/15 text-success",
  bank: "bg-accent/15 text-accent",
  credit: "bg-warning/15 text-warning",
  mobile: "bg-pink-500/15 text-pink-400",
  savings: "bg-sky-500/15 text-sky-400",
};

interface AccountCardProps {
  account: Account;
  onEdit?: (account: Account) => void;
  onArchive?: (account: Account) => void;
  onRestore?: (account: Account) => void;
}

export function AccountCard({ account, onEdit, onArchive, onRestore }: AccountCardProps) {
  const Icon = ACCOUNT_ICONS[account.type];
  const negative = account.balance < 0;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={cn(
        "group relative flex flex-col rounded-2xl border border-border bg-surface/80 p-4 shadow-card transition hover:border-border-strong",
        account.is_archived && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", ACCOUNT_TINTS[account.type])}>
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-fg">{account.name}</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <Badge tone="outline">{ACCOUNT_TYPE_LABELS[account.type]}</Badge>
              {account.is_archived && <Badge tone="muted">Archived</Badge>}
            </div>
          </div>
        </div>
        {(onEdit || onArchive || onRestore) && (
          <div className="flex opacity-0 transition group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100">
            {onEdit && !account.is_archived && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(account)} aria-label="Edit account">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {onArchive && !account.is_archived && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onArchive(account)} aria-label="Archive account">
                <Archive className="h-3.5 w-3.5" />
              </Button>
            )}
            {onRestore && account.is_archived && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onRestore(account)} aria-label="Restore account">
                <ArchiveRestore className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>

      <p className={cn("tnum mt-4 text-2xl font-semibold tracking-tight", negative ? "text-danger" : "text-fg")}>
        {formatMoney(account.balance, account.currency)}
      </p>

      <Link
        href={`/transactions?account_id=${account.id}`}
        className="mt-3 inline-flex items-center gap-1 self-start text-xs font-medium text-fg-muted transition hover:text-accent"
      >
        View transactions
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </motion.li>
  );
}
