"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus, Wallet } from "lucide-react";

import type { Transaction } from "@/lib/types";
import { Button, Card, CardBody, CardHeader, ConfirmDialog, EmptyState, Modal, PageHeader, Skeleton } from "@/components/ui";
import { useAuth } from "@/features/auth/store";
import { useAccounts } from "@/features/accounts/hooks";
import { AccountCard } from "@/features/accounts/components/AccountCard";
import { useCategoryBreakdown, useMonthNav, useMonthlySummary } from "@/features/dashboard/hooks";
import { CategoryBreakdown } from "@/features/dashboard/components/CategoryBreakdown";
import { KpiRow } from "@/features/dashboard/components/KpiRow";
import { MonthPicker } from "@/features/dashboard/components/MonthPicker";
import { useDeleteTransaction, useTransactions } from "@/features/transactions/hooks";
import { TransactionForm } from "@/features/transactions/components/TransactionForm";
import { TransactionList } from "@/features/transactions/components/TransactionList";

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function DashboardPage() {
  const user = useAuth((s) => s.user);
  const month = useMonthNav();
  const summary = useMonthlySummary(month);
  const breakdown = useCategoryBreakdown(month);
  const accounts = useAccounts();
  const recent = useTransactions({ limit: 6 });
  const remove = useDeleteTransaction();

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);

  const addButton = (
    <Button onClick={() => setAdding(true)}>
      <Plus className="h-4 w-4" />
      Add transaction
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}${user ? `, ${user.name.split(" ")[0]}` : ""}`}
        description={
          (month.isCurrent ? "Here's where your money stands this month" : `Looking back at ${month.label}`) +
          (summary.data ? ` · ${summary.data.transaction_count} transaction${summary.data.transaction_count === 1 ? "" : "s"}.` : ".")
        }
        actions={
          <>
            <MonthPicker nav={month} />
            {addButton}
          </>
        }
      />

      <KpiRow summary={summary.data} isLoading={summary.isLoading} />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <CategoryBreakdown data={breakdown.data} isLoading={breakdown.isLoading} />

        <Card>
          <CardHeader
            title="Accounts"
            action={
              <Link href="/accounts" className="inline-flex items-center gap-1 text-xs font-medium text-fg-muted hover:text-accent">
                Manage <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            }
          />
          <CardBody className="pt-4">
            {accounts.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
            ) : (accounts.data ?? []).length === 0 ? (
              <EmptyState icon={Wallet} title="No accounts" className="py-8" />
            ) : (
              <ul className="grid gap-3">
                {(accounts.data ?? []).map((a) => (
                  <AccountCard key={a.id} account={a} />
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-fg">Recent activity</h2>
          <Link href="/transactions" className="inline-flex items-center gap-1 text-xs font-medium text-fg-muted hover:text-accent">
            View all <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
        <TransactionList
          transactions={recent.data?.items ?? []}
          accounts={accounts.data ?? []}
          isLoading={recent.isLoading}
          isError={recent.isError}
          grouped={false}
          emptyAction={addButton}
          onEdit={setEditing}
          onDelete={setDeleting}
        />
      </section>

      <Modal open={adding} title="Add transaction" description="Describe it in plain words; the AI files it." onClose={() => setAdding(false)}>
        <TransactionForm onDone={() => setAdding(false)} />
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
