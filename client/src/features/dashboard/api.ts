import { http, toQuery } from "@/lib/api-client";
import type { MonthlySummary } from "@/lib/types";

export const dashboardApi = {
  summary: (year?: number, month?: number) =>
    http.get<MonthlySummary>(`/dashboard/summary${toQuery({ year, month })}`),
};
