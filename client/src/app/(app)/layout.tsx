"use client";

import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { FullScreenSpinner } from "@/components/ui";
import { useRequireAuth } from "@/features/auth/hooks";

/** Every route in this group is behind auth; the guard lives here, once. */
export default function AppLayout({ children }: { children: ReactNode }) {
  const { ready } = useRequireAuth();
  if (!ready) return <FullScreenSpinner />;
  return <AppShell>{children}</AppShell>;
}
