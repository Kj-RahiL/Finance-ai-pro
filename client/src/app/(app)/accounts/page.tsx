"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Plus, Wallet } from "lucide-react";

import { formatMoney } from "@/lib/format";
import type { Account } from "@/lib/types";
import { Button, ConfirmDialog, EmptyState, Modal, PageHeader, Skeleton } from "@/components/ui";
import { useAccounts, useArchiveAccount, useUpdateAccount } from "@/features/accounts/hooks";
import { AccountCard } from "@/features/accounts/components/AccountCard";
import { AccountForm } from "@/features/accounts/components/AccountForm";

type Editor = { mode: "create" } | { mode: "edit"; account: Account } | null;

export default function AccountsPage() {
  const [showArchived, setShowArchived] = useState(false);
  const [editor, setEditor] = useState<Editor>(null);
  const [archiving, setArchiving] = useState<Account | null>(null);

  const accounts = useAccounts(showArchived);
  const archive = useArchiveAccount();
  const update = useUpdateAccount();

  const list = accounts.data ?? [];
  const active = list.filter((a) => !a.is_archived);
  const total = active.reduce((sum, a) => sum + a.balance, 0);

  const newButton = (
    <Button onClick={() => setEditor({ mode: "create" })}>
      <Plus className="h-4 w-4" />
      New account
    </Button>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Accounts"
        description={
          accounts.data
            ? `${active.length} active · ${formatMoney(total)} combined balance`
            : undefined
        }
        actions={
          <>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-fg-muted">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="h-4 w-4 rounded border-border bg-surface accent-accent"
              />
              Show archived
            </label>
            {newButton}
          </>
        }
      />

      {accounts.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No accounts yet"
          description="Add your cash, bank, or mobile wallet to start tracking balances."
          action={newButton}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {list.map((a) => (
              <AccountCard
                key={a.id}
                account={a}
                onEdit={(acct) => setEditor({ mode: "edit", account: acct })}
                onArchive={setArchiving}
                onRestore={(acct) => update.mutate({ id: acct.id, data: { is_archived: false } })}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}

      <Modal
        open={editor !== null}
        title={editor?.mode === "edit" ? "Edit account" : "New account"}
        description={editor?.mode === "create" ? "Cash, bank, card, or a mobile wallet like bKash." : undefined}
        onClose={() => setEditor(null)}
        size="sm"
      >
        {editor && <AccountForm account={editor.mode === "edit" ? editor.account : undefined} onDone={() => setEditor(null)} />}
      </Modal>
      <ConfirmDialog
        open={archiving !== null}
        title={archiving ? `Archive "${archiving.name}"?` : "Archive account?"}
        description="Its history is kept and its balance still counts, but it stops accepting new transactions. You can restore it any time."
        confirmLabel="Archive"
        loading={archive.isPending}
        onConfirm={() => archiving && archive.mutate(archiving.id, { onSuccess: () => setArchiving(null) })}
        onClose={() => setArchiving(null)}
      />
    </div>
  );
}
