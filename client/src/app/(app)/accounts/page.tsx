"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";

import type { Account } from "@/lib/types";
import { Button, EmptyState, Modal, SectionTitle, Spinner } from "@/components/ui";
import { useAccounts, useArchiveAccount, useUpdateAccount } from "@/features/accounts/hooks";
import { AccountCard } from "@/features/accounts/components/AccountCard";
import { AccountForm } from "@/features/accounts/components/AccountForm";

type Editor = { mode: "create" } | { mode: "edit"; account: Account } | null;

export default function AccountsPage() {
  const [showArchived, setShowArchived] = useState(false);
  const [editor, setEditor] = useState<Editor>(null);

  const accounts = useAccounts(showArchived);
  const archive = useArchiveAccount();
  const update = useUpdateAccount();

  function onArchive(account: Account) {
    if (window.confirm(`Archive "${account.name}"? Its history is kept; it just stops accepting transactions.`)) {
      archive.mutate(account.id);
    }
  }

  const list = accounts.data ?? [];

  return (
    <div className="space-y-4">
      <SectionTitle
        action={
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="accent-indigo-500"
              />
              Show archived
            </label>
            <Button size="sm" onClick={() => setEditor({ mode: "create" })}>
              + New account
            </Button>
          </div>
        }
      >
        Accounts
      </SectionTitle>

      {accounts.isLoading ? (
        <div className="grid place-items-center py-12 text-slate-500">
          <Spinner />
        </div>
      ) : list.length === 0 ? (
        <EmptyState>No accounts yet.</EmptyState>
      ) : (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {list.map((a) => (
              <AccountCard
                key={a.id}
                account={a}
                onEdit={(acct) => setEditor({ mode: "edit", account: acct })}
                onArchive={onArchive}
                onRestore={(acct) => update.mutate({ id: acct.id, data: { is_archived: false } })}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}

      <Modal
        open={editor !== null}
        title={editor?.mode === "edit" ? "Edit account" : "New account"}
        onClose={() => setEditor(null)}
      >
        {editor && (
          <AccountForm
            account={editor.mode === "edit" ? editor.account : undefined}
            onDone={() => setEditor(null)}
          />
        )}
      </Modal>
    </div>
  );
}
