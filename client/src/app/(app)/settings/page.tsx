"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, LogOut, Mail, Tags, UserRound } from "lucide-react";

import { request } from "@/lib/api-client";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge, Button, Card, CardBody, CardHeader, PageHeader, Skeleton } from "@/components/ui";
import { useLogout } from "@/features/auth/hooks";
import { useAuth } from "@/features/auth/store";
import { useCategories } from "@/features/categories/hooks";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function useApiHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => request<{ status: string }>("/health"),
    retry: false,
    refetchInterval: 30_000,
  });
}

export default function SettingsPage() {
  const user = useAuth((s) => s.user);
  const logout = useLogout();
  const categories = useCategories();
  const health = useApiHealth();

  const groups = [
    { label: "Expense", tone: "text-danger", items: (categories.data ?? []).filter((c) => c.type === "expense") },
    { label: "Income", tone: "text-success", items: (categories.data ?? []).filter((c) => c.type === "income") },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Your profile, categories, and connection status." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Profile" description="How you appear in the app." />
          <CardBody className="pt-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-accent/20 text-lg font-semibold text-accent">
                  {initials(user.name)}
                </span>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="flex items-center gap-2 text-sm text-fg">
                    <UserRound className="h-4 w-4 text-fg-subtle" aria-hidden /> {user.name}
                  </p>
                  <p className="flex items-center gap-2 text-sm text-fg-muted">
                    <Mail className="h-4 w-4 text-fg-subtle" aria-hidden /> {user.email}
                  </p>
                </div>
              </div>
            ) : (
              <Skeleton className="h-14" />
            )}
            <p className="mt-4 text-xs text-fg-subtle">Password change and two-factor auth arrive in a later phase.</p>
            <div className="mt-5 border-t border-border pt-4">
              <Button variant="danger" onClick={logout}>
                <LogOut className="h-4 w-4" /> Log out of this device
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Connection"
            description="The API this app talks to."
            action={
              <Badge tone={health.isSuccess ? "success" : health.isError ? "danger" : "muted"}>
                <Activity className="h-3 w-3" aria-hidden />
                {health.isSuccess ? "Online" : health.isError ? "Unreachable" : "Checking…"}
              </Badge>
            }
          />
          <CardBody className="pt-4">
            <dl className="space-y-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-fg-muted">API URL</dt>
                <dd className="truncate font-mono text-xs text-fg">{API_URL}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-fg-muted">AI categorization</dt>
                <dd className="text-fg">Server-side · Claude</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-fg-muted">Base currency</dt>
                <dd className="text-fg">BDT (৳)</dd>
              </div>
            </dl>
            {health.isError && (
              <p className="mt-4 text-xs text-danger">
                Can&apos;t reach the server. Check that it&apos;s running and that <code>NEXT_PUBLIC_API_URL</code> points at it.
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Categories"
          description="The AI files transactions into this set. Custom categories are planned."
          action={
            <span className="inline-flex items-center gap-1 text-xs text-fg-subtle">
              <Tags className="h-3.5 w-3.5" aria-hidden /> {categories.data?.length ?? 0} total
            </span>
          }
        />
        <CardBody className="space-y-5 pt-4">
          {categories.isLoading ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-11" />
              ))}
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.label}>
                <p className={cn("mb-2 text-xs font-semibold uppercase tracking-wide", group.tone)}>{group.label}</p>
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {group.items.map((c) => (
                    <li key={c.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface/60 px-3 py-2.5">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-3 text-base" aria-hidden>
                        {c.icon}
                      </span>
                      <span className="text-sm font-medium text-fg">{c.name}</span>
                      {c.is_default && <Badge tone="muted" className="ml-auto">Default</Badge>}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </CardBody>
      </Card>
    </div>
  );
}
