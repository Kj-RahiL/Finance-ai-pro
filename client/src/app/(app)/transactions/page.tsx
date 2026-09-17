"use client";

import { Suspense, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import type { Transaction } from "@/lib/types";
import { Button, ConfirmDialog, ListSkeleton, Modal, PageHeader } from "@/components/ui";
import { useAccounts } from "@/features/accounts/hooks";
import { useCategories } from "@/features/categories/hooks";
import { useDeleteTransaction, useTransactions } from "@/features/transactions/hooks";
import { useUrlFilters } from "@/features/transactions/use-url-filters";
import { TransactionFilters, isFiltered } from "@/features/transactions/components/TransactionFilters";
import { TransactionForm } from "@/features/transactions/components/TransactionForm";
import { TransactionList } from "@/features/transactions/components/TransactionList";

const PAGE_SIZE = 25;

function TransactionsView() {
  const [filters, setFilters] = useUrlFilters(PAGE_SIZE);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);

  const accounts = useAccounts();
  const categories = useCategories();
  const page = useTransactions(filters);
  const remove = useDeleteTransaction();

  const total = page.data?.total ?? 0;
  const offset = filters.offset ?? 0;
  const hasPrev = offset > 0;
  const hasNext = offset + PAGE_SIZE < total;
  const filtered = isFiltered(filters);

  const addButton = (
    <Button onClick={() => setAdding(true)}>
      <Plus className="h-4 w-4" />
      Add transaction
    </Button>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Transactions"
        description={
          page.data ? `${total} ${filtered ? "matching" : "total"} · showing ${total === 0 ? 0 : offset + 1}–${Math.min(offset + PAGE_SIZE, total)}` : undefined
        }
        actions={addButton}
      />

      <TransactionFilters value={filters} onChange={setFilters} accounts={accounts.data ?? []} categories={categories.data ?? []} />

      <TransactionList
        transactions={page.data?.items ?? []}
        accounts={accounts.data ?? []}
        isLoading={page.isLoading}
        isError={page.isError}
        emptyTitle={filtered ? "Nothing matches these filters" : "No transactions yet"}
        emptyDescription={filtered ? "Try widening the date range or clearing a filter." : "Add your first one and the AI will file it for you."}
        emptyAction={filtered ? <Button variant="outline" onClick={() => setFilters({ limit: PAGE_SIZE, offset: 0 })}>Clear filters</Button> : addButton}
        onEdit={setEditing}
        onDelete={setDeleting}
      />

      {(hasPrev || hasNext) && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" disabled={!hasPrev} onClick={() => setFilters({ ...filters, offset: Math.max(0, offset - PAGE_SIZE) })}>
            <ChevronLeft className="h-4 w-4" /> Newer
          </Button>
          <span className="tnum px-2 text-xs text-fg-subtle">
            Page {Math.floor(offset / PAGE_SIZE) + 1} of {Math.max(1, Math.ceil(total / PAGE_SIZE))}
          </span>
          <Button variant="outline" size="sm" disabled={!hasNext} onClick={() => setFilters({ ...filters, offset: offset + PAGE_SIZE })}>
            Older <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Modal open={adding} title="Add transaction" description="Describe it in plain words; the AI files it." onClose={() => setAdding(false)}>
        <TransactionForm defaultAccountId={filters.account_id} onDone={() => setAdding(false)} />
      </Modal>
      <Modal open={editing !== null} title="Edit transaction" onClose={() => setEditing(null)}>
        {editing && (
          <TransactionForm
            transaction={editing}
            onDelete={(txn) => {
              setEditing(null);
              setDeleting(txn);
            }}
            onDone={() => setEditing(null)}
          />
        )}
      </Modal>
      <ConfirmDialog
        open={deleting !== null}
        title="Delete this transaction?"
        description={deleting ? `"${deleting.description}" will be removed and the account balance restored.` : undefined}
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

export default function TransactionsPage() {
  // useSearchParams needs a Suspense boundary for static prerendering.
  return (
    <Suspense fallback={<ListSkeleton rows={6} />}>
      <TransactionsView />
    </Suspense>
  );
}
