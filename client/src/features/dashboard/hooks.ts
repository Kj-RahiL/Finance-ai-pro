"use client";

import { useCallback, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { monthLabel } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { dashboardApi } from "./api";

export interface YearMonth {
  year: number;
  month: number;
}

/** Month navigation state: prev/next with a "back to this month" shortcut. */
export function useMonthNav() {
  const now = new Date();
  const current: YearMonth = { year: now.getFullYear(), month: now.getMonth() + 1 };
  const [value, setValue] = useState<YearMonth>(current);

  const shift = useCallback((delta: number) => {
    setValue((v) => {
      const d = new Date(v.year, v.month - 1 + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });
  }, []);

  const isCurrent = value.year === current.year && value.month === current.month;
  // Don't let users navigate into the future — there's nothing there yet.
  const canGoNext = value.year < current.year || (value.year === current.year && value.month < current.month);

  return {
    ...value,
    label: monthLabel(value.year, value.month),
    isCurrent,
    canGoNext,
    prev: () => shift(-1),
    next: () => canGoNext && shift(1),
    reset: () => setValue(current),
  };
}

export function useMonthlySummary({ year, month }: YearMonth) {
  return useQuery({
    queryKey: queryKeys.dashboard.summary(year, month),
    queryFn: () => dashboardApi.summary(year, month),
    placeholderData: keepPreviousData,
  });
}

export function useCategoryBreakdown({ year, month }: YearMonth) {
  return useQuery({
    queryKey: queryKeys.dashboard.categories(year, month),
    queryFn: () => dashboardApi.categories(year, month),
    placeholderData: keepPreviousData,
  });
}
