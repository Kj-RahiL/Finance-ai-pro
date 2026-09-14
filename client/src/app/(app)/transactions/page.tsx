"use client";

import { useState } from "react";

import type { Transaction, TransactionFilters as Filters } from "@/lib/types";
import { Button, Card, Modal, SectionTitle } from "@/components/ui";
import { useAccounts } from "@/features/accounts/hooks";
import { useCategories } from "@/features/categories/hooks";
import { useDeleteTransaction, useTransactions } from "@/features/transactions/hooks";
import { TransactionFilters } from "@/features/transactions/components/TransactionFilters";
import { TransactionForm } from "@/features/transactions/components/TransactionForm";
import { TransactionList } from "@/features/transactions/components/TransactionList";

const PAGE_SIZE = 25;

export default function TransactionsPage() {
  const [filters, setFilters] = useState<Filters>({ limit: PAGE_SIZE, offset: 0 });
  const [editing, setEditing] = useState<Transaction | null>(null);

  const accounts = useAccounts();
  const categories = useCategories();
  const page = useTransactions(filters);
  const remove = useDeleteTransaction();

  const total = page.data?.total ?? 0;
  const offset = filters.offset ?? 0;
  const hasPrev = offset > 0;
  const hasNext = offset + PAGE_SIZE < total;

  function onDelete(txn: Transaction) {
    if (window.confirm(`Delete "${txn.description}"? The account balance will be restored.`)) {
      remove.mutate(txn.id);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-sm font-medium text-slate-300">Add a transaction</h2>
        <div className="mt-3">
          <TransactionForm compact />
        </div>
      </Card>

      <section>
        <SectionTitle
          action={
            page.data && (
              <span className="text-xs text-slate-500">
                {total === 0 ? "0" : `${offset + 1}–${Math.min(offset + PAGE_SIZE, total)}`} of {total}
              </span>
            )
          }
        >
          Transactions
        </SectionTitle>

        <div className="mb-4">
          <TransactionFilters
            value={filters}
            onChange={setFilters}
            accounts={accounts.data ?? []}
            categories={categories.data ?? []}
          />
        </div>

        <TransactionList
          transactions={page.data?.items ?? []}
          accounts={accounts.data ?? []}
          isLoading={page.isLoading}
          isError={page.isError}
          emptyMessage="Nothing matches these filters."
          onEdit={setEditing}
          onDelete={onDelete}
        />

        {(hasPrev || hasNext) && (
          <div className="mt-4 flex justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={!hasPrev}
              onClick={() => setFilters((f) => ({ ...f, offset: Math.max(0, offset - PAGE_SIZE) }))}
            >
              ← Newer
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={!hasNext}
              onClick={() => setFilters((f) => ({ ...f, offset: offset + PAGE_SIZE }))}
            >
              Older →
            </Button>
          </div>
        )}
      </section>

      <Modal open={editing !== null} title="Edit transaction" onClose={() => setEditing(null)}>
        {editing && <TransactionForm transaction={editing} onDone={() => setEditing(null)} />}
      </Modal>
    </div>
  );
}
