"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button, cn } from "@/components/ui";
import { useLogout } from "@/features/auth/hooks";
import { useAuth } from "@/features/auth/store";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/accounts", label: "Accounts" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const user = useAuth((s) => s.user);
  const logout = useLogout();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dashboard" className="text-xl font-semibold text-white">
            FinanceAI Pro
          </Link>
          {user && <p className="text-sm text-slate-400">Hi, {user.name}</p>}
        </div>
        <nav className="flex items-center gap-1" aria-label="Primary">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                  active ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <Button variant="ghost" size="sm" onClick={logout} className="ml-2">
            Log out
          </Button>
        </nav>
      </header>
      <main className="mt-6">{children}</main>
    </div>
  );
}
