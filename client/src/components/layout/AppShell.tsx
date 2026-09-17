"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, LayoutDashboard, LogOut, Sparkles, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import { useLogout } from "@/features/auth/hooks";
import { useAuth } from "@/features/auth/store";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/accounts", label: "Accounts", icon: Wallet },
];

export function Brand({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <span
        className={cn(
          "grid place-items-center rounded-lg bg-accent text-accent-fg shadow-[0_0_24px_-6px_hsl(var(--accent))]",
          size === "lg" ? "h-9 w-9" : "h-8 w-8",
        )}
      >
        <Sparkles className="h-4 w-4" aria-hidden />
      </span>
      <span className={cn("font-semibold tracking-tight text-fg", size === "lg" ? "text-lg" : "text-[15px]")}>
        FinanceAI <span className="text-fg-muted">Pro</span>
      </span>
    </Link>
  );
}

function NavLink({ href, label, icon: Icon, active, compact }: (typeof NAV)[number] & { active: boolean; compact?: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg text-sm font-medium transition",
        compact ? "flex-col gap-1 px-3 py-2 text-[11px]" : "px-3 py-2",
        active ? "bg-surface-3 text-fg" : "text-fg-muted hover:bg-surface-2 hover:text-fg",
      )}
    >
      <Icon className={cn("h-[18px] w-[18px]", active && "text-accent")} aria-hidden />
      {label}
    </Link>
  );
}

function UserMenu() {
  const user = useAuth((s) => s.user);
  const logout = useLogout();
  if (!user) return null;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-2/60 p-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent/20 text-xs font-semibold text-accent">
        {initials(user.name)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-fg">{user.name}</p>
        <p className="truncate text-xs text-fg-subtle">{user.email}</p>
      </div>
      <Button variant="ghost" size="icon" onClick={logout} aria-label="Log out" title="Log out">
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const logout = useLogout();
  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-border bg-surface/60 px-4 py-5 backdrop-blur lg:flex">
        <div className="px-2">
          <Brand />
        </div>
        <nav className="mt-8 flex flex-col gap-1" aria-label="Primary">
          {NAV.map((item) => (
            <NavLink key={item.href} {...item} active={isActive(item.href)} />
          ))}
        </nav>
        <div className="mt-auto">
          <UserMenu />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-bg/80 px-4 py-3 backdrop-blur lg:hidden">
        <Brand />
        <Button variant="ghost" size="icon" onClick={logout} aria-label="Log out">
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">{children}</main>

      {/* Mobile bottom tabs */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-border bg-bg/90 px-2 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur lg:hidden"
        aria-label="Primary"
      >
        {NAV.map((item) => (
          <NavLink key={item.href} {...item} active={isActive(item.href)} compact />
        ))}
      </nav>
    </div>
  );
}
