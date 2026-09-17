"use client";

import { useState } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { Archive, ArchiveRestore, ArrowLeft, ArrowUpRight, Pencil, Plus } from "lucide-react";

import { ApiError } from "@/lib/api-client";
import { ACCOUNT_TYPE_LABELS, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/lib/types";
import { Badge, Button, ConfirmDialog, ListSkeleton, Modal, PageHeader, Skeleton } from "@/components/ui";
import { useAccount, useAccounts, useArchiveAccount, useUpdateAccount } from "@/features/accounts/hooks";
import { ACCOUNT_ICONS } from "@/features/accounts/components/AccountCard";
import { AccountForm } from "@/features/accounts/components/AccountForm";
import { useDeleteTransaction, useTransactions } from "@/features/transactions/hooks";
import { TransactionForm } from "@/features/transactions/components/TransactionForm";
import { TransactionList } from "@/features/transactions/components/TransactionList";

const PAGE_SIZE = 20;

export default function AccountDetailPage() {
  const { id: raw } = useParams<{ id: string }>();
  const id = Number(raw);

  const account = useAccount(id);
  const accounts = useAccounts(true);
  const archive = useArchiveAccount();
  const update = useUpdateAccount();
  const remove = useDeleteTransaction();

  const [offset, setOffset] = useState(0);
  const page = useTransactions({ account_id: id, limit: PAGE_SIZE, offset });

  const [editing, setEditing] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [deletingTxn, setDeletingTxn] = useState<Transaction | null>(null);

  // Bad id or someone else's account → the 404 page (the API never leaks other users' ids).
  if (!Number.isFinite(id) || (account.error instanceof ApiError && account.error.status === 404)) notFound();

  const a = account.data;
  const Icon = a ? ACCOUNT_ICONS[a.type] : null;
  const total = page.data?.total ?? 0;
  const addButton = a && !a.is_archived && (
    <Button onClick={() => setAdding(true)}>
      <Plus className="h-4 w-4" /> Add transaction
    </Button>
  );

  return (
    <div className="space-y-6">
      <Link href="/accounts" className="inline-flex items-center gap-1 text-xs font-medium text-fg-muted hover:text-accent">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> All accounts
      </Link>

      {a ? (
        <PageHeader
          title={a.name}
          description={`${ACCOUNT_TYPE_LABELS[a.type]} · ${total} transaction${total === 1 ? "" : "s"}`}
          actions={
            a.is_archived ? (
              <Button variant="outline" onClick={() => update.mutate({ id: a.id, data: { is_archived: false } })} loading={update.isPending}>
                <ArchiveRestore className="h-4 w-4" /> Restore
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setArchiving(true)}>
                  <Archive className="h-4 w-4" /> Archive
                </Button>
                <Button variant="outline" onClick={() => setEditing(true)}>
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
                {addButton}
              </>
            )
          }
        />
      ) : (
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      )}

      <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-surface/80 p-5 shadow-card">
        {a && Icon ? (
          <>
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent/15 text-accent">
              <Icon className="h-6 w-6" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">Current balance</p>
              <p className={cn("tnum text-3xl font-semibold tracking-tight", a.balance < 0 ? "text-danger" : "text-fg")}>
                {formatMoney(a.balance, a.currency)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="outline">{a.currency}</Badge>
              {a.is_archived && <Badge tone="muted">Archived</Badge>}
            </div>
          </>
        ) : (
          <Skeleton className="h-12 w-full" />
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-fg">Transactions</h2>
          <Link href={`/transactions?account_id=${id}`} className="inline-flex items-center gap-1 text-xs font-medium text-fg-muted hover:text-accent">
            Filter &amp; search <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
        {account.isLoading ? (
          <ListSkeleton rows={4} />
        ) : (
          <TransactionList
            transactions={page.data?.items ?? []}
            accounts={accounts.data ?? []}
            isLoading={page.isLoading}
            isError={page.isError}
            emptyTitle="Nothing here yet"
            emptyDescription={a?.is_archived ? "This account is archived." : "Add the first transaction for this account."}
            emptyAction={addButton || undefined}
            onEdit={setEditingTxn}
            onDelete={setDeletingTxn}
          />
        )}
        {total > PAGE_SIZE && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>
              Newer
            </Button>
            <span className="tnum text-xs text-fg-subtle">
              Page {Math.floor(offset / PAGE_SIZE) + 1} of {Math.ceil(total / PAGE_SIZE)}
            </span>
            <Button variant="outline" size="sm" disabled={offset + PAGE_SIZE >= total} onClick={() => setOffset(offset + PAGE_SIZE)}>
              Older
            </Button>
          </div>
        )}
      </section>

      <Modal open={editing} title="Edit account" onClose={() => setEditing(false)} size="sm">
        {a && <AccountForm account={a} onDone={() => setEditing(false)} />}
      </Modal>
      <ConfirmDialog
        open={archiving}
        title={a ? `Archive "${a.name}"?` : "Archive account?"}
        description="Its history is kept and its balance still counts, but it stops accepting new transactions. You can restore it any time."
        confirmLabel="Archive"
        loading={archive.isPending}
        onConfirm={() => a && archive.mutate(a.id, { onSuccess: () => setArchiving(false) })}
        onClose={() => setArchiving(false)}
      />
      <Modal open={adding} title="Add transaction" description={a ? `Into ${a.name}` : undefined} onClose={() => setAdding(false)}>
        <TransactionForm defaultAccountId={id} onDone={() => setAdding(false)} />
      </Modal>
      <Modal open={editingTxn !== null} title="Edit transaction" onClose={() => setEditingTxn(null)}>
        {editingTxn && (
          <TransactionForm
            transaction={editingTxn}
            onDelete={(txn) => {
              setEditingTxn(null);
              setDeletingTxn(txn);
            }}
            onDone={() => setEditingTxn(null)}
          />
        )}
      </Modal>
      <ConfirmDialog
        open={deletingTxn !== null}
        title="Delete this transaction?"
        description={deletingTxn ? `"${deletingTxn.description}" will be removed and the balance restored.` : undefined}
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
        onConfirm={() => deletingTxn && remove.mutate(deletingTxn.id, { onSuccess: () => setDeletingTxn(null) })}
        onClose={() => setDeletingTxn(null)}
      />
    </div>
  );
}
