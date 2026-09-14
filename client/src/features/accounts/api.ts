import { http, toQuery } from "@/lib/api-client";
import type { Account, AccountCreate, AccountUpdate } from "@/lib/types";

export const accountsApi = {
  list: (includeArchived = false) =>
    http.get<Account[]>(`/accounts${toQuery({ include_archived: includeArchived || undefined })}`),
  create: (data: AccountCreate) => http.post<Account>("/accounts", data),
  update: (id: number, data: AccountUpdate) => http.patch<Account>(`/accounts/${id}`, data),
  /** Soft delete — the server archives the account and keeps its history. */
  archive: (id: number) => http.delete<Account>(`/accounts/${id}`),
};
