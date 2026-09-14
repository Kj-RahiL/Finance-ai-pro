import type { TransactionFilters } from "./types";

/** Central query-key registry so invalidation stays consistent across features. */
export const queryKeys = {
  accounts: (includeArchived = false) => ["accounts", { includeArchived }] as const,
  categories: ["categories"] as const,
  transactions: {
    all: ["transactions"] as const,
    list: (filters: TransactionFilters) => ["transactions", "list", filters] as const,
  },
  summary: (year?: number, month?: number) => ["dashboard", "summary", { year, month }] as const,
};
