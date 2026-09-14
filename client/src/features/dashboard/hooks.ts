"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { dashboardApi } from "./api";

export function useMonthlySummary(year?: number, month?: number) {
  return useQuery({
    queryKey: queryKeys.summary(year, month),
    queryFn: () => dashboardApi.summary(year, month),
  });
}
