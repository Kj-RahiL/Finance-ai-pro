"use client";

import Link from "next/link";

import { Card, SectionTitle } from "@/components/ui";
import { useAccounts } from "@/features/accounts/hooks";
import { AccountCard } from "@/features/accounts/components/AccountCard";
import { useMonthlySummary } from "@/features/dashboard/hooks";
import { SummaryCards } from "@/features/dashboard/components/SummaryCards";
import { useTransactions } from "@/features/transactions/hooks";
import { TransactionForm } from "@/features/transactions/components/TransactionForm";
import { TransactionList } from "@/features/transactions/components/TransactionList";

export default function DashboardPage() {
  const summary = useMonthlySummary();
  const accounts = useAccounts();
  const recent = useTransactions({ limit: 5 });

  return (
    <div className="space-y-6">
      <SummaryCards summary={summary.data} isLoading={summary.isLoading} />

      <Card>
        <h2 className="text-sm font-medium text-slate-300">Quick add</h2>
        <div className="mt-3">
          <TransactionForm compact />
        </div>
      </Card>

      <section>
        <SectionTitle
          action={
            <Link href="/accounts" className="text-xs text-indigo-400 hover:text-indigo-300">
              Manage
            </Link>
          }
        >
          Accounts
        </SectionTitle>
        <ul className="space-y-2">
          {(accounts.data ?? []).map((a) => (
            <AccountCard key={a.id} account={a} />
          ))}
        </ul>
      </section>

      <section>
        <SectionTitle
          action={
            <Link href="/transactions" className="text-xs text-indigo-400 hover:text-indigo-300">
              View all
            </Link>
          }
        >
          Recent transactions
        </SectionTitle>
        <TransactionList
          transactions={recent.data?.items ?? []}
          accounts={accounts.data ?? []}
          isLoading={recent.isLoading}
          isError={recent.isError}
        />
      </section>
    </div>
  );
}
