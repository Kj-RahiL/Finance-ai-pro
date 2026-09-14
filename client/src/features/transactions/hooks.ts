"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { TransactionCreate, TransactionFilters, TransactionUpdate } from "@/lib/types";
import { transactionsApi } from "./api";

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: queryKeys.transactions.list(filters),
    queryFn: () => transactionsApi.list(filters),
    placeholderData: keepPreviousData, // filter changes don't flash an empty list
  });
}

/** Any transaction write moves an account balance and the monthly summary. */
function useInvalidateTransactions() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };
}

export function useCreateTransaction() {
  const invalidate = useInvalidateTransactions();
  return useMutation({
    mutationFn: (data: TransactionCreate) => transactionsApi.create(data),
    onSuccess: invalidate,
  });
}

export function useUpdateTransaction() {
  const invalidate = useInvalidateTransactions();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TransactionUpdate }) =>
      transactionsApi.update(id, data),
    onSuccess: invalidate,
  });
}

export function useDeleteTransaction() {
  const invalidate = useInvalidateTransactions();
  return useMutation({
    mutationFn: (id: number) => transactionsApi.remove(id),
    onSuccess: invalidate,
  });
}
