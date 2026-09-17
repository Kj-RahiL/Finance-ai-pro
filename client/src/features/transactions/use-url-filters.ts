"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { TransactionFilters } from "@/lib/types";

const KEYS = ["q", "type", "account_id", "category_id", "date_from", "date_to", "offset"] as const;

/**
 * Transaction filters live in the URL so views are shareable and other pages
 * can deep-link (e.g. an account card → its transactions).
 */
export function useUrlFilters(pageSize: number): [TransactionFilters, (next: TransactionFilters) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const filters = useMemo<TransactionFilters>(() => {
    const num = (k: string) => (params.get(k) ? Number(params.get(k)) : undefined);
    const type = params.get("type");
    return {
      q: params.get("q") ?? undefined,
      type: type === "income" || type === "expense" ? type : undefined,
      account_id: num("account_id"),
      category_id: num("category_id"),
      date_from: params.get("date_from") ?? undefined,
      date_to: params.get("date_to") ?? undefined,
      limit: pageSize,
      offset: num("offset") ?? 0,
    };
  }, [params, pageSize]);

  const setFilters = useCallback(
    (next: TransactionFilters) => {
      const sp = new URLSearchParams();
      for (const key of KEYS) {
        const value = next[key];
        if (value === undefined || value === "" || (key === "offset" && !value)) continue;
        sp.set(key, String(value));
      }
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  return [filters, setFilters];
}
