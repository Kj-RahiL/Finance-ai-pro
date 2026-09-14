"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { CategoryType } from "@/lib/types";
import { categoriesApi } from "./api";

export function useCategories(type?: CategoryType) {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: categoriesApi.list,
    staleTime: 5 * 60_000, // seeded set; rarely changes
    select: (cats) => (type ? cats.filter((c) => c.type === type) : cats),
  });
}
