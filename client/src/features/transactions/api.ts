import { http, toQuery } from "@/lib/api-client";
import type {
  Page,
  Transaction,
  TransactionCreate,
  TransactionFilters,
  TransactionUpdate,
} from "@/lib/types";

export const transactionsApi = {
  list: (filters: TransactionFilters = {}) =>
    http.get<Page<Transaction>>(`/transactions${toQuery(filters)}`),
  create: (data: TransactionCreate) => http.post<Transaction>("/transactions", data),
  update: (id: number, data: TransactionUpdate) => http.patch<Transaction>(`/transactions/${id}`, data),
  remove: (id: number) => http.delete(`/transactions/${id}`),
};
