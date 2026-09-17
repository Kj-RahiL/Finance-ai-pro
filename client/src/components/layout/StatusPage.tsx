"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Brand } from "@/components/layout/AppShell";
import { Button } from "@/components/ui";

interface StatusPageProps {
  icon: LucideIcon;
  code?: string;
  title: string;
  description: string;
  /** Extra detail shown in a muted monospace block (e.g. an error digest). */
  detail?: string;
  actions?: ReactNode;
}

/** Shared layout for 404 / error / offline style pages — centered, branded, calm. */
export function StatusPage({ icon: Icon, code, title, description, detail, actions }: StatusPageProps) {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <Brand />
        </div>
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-border bg-surface-2 text-fg-muted">
          <Icon className="h-6 w-6" aria-hidden />
        </div>
        {code && <p className="tnum text-xs font-semibold uppercase tracking-[0.2em] text-fg-subtle">{code}</p>}
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-fg">{title}</h1>
        <p className="mt-2 text-sm text-fg-muted">{description}</p>
        {detail && (
          <pre className="mt-4 overflow-x-auto rounded-lg border border-border bg-surface p-3 text-left text-xs text-fg-subtle">
            {detail}
          </pre>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {actions ?? (
            <Button asChild>
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
