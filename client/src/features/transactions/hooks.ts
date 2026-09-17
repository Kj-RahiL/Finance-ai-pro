"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError } from "@/lib/api-client";
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

export const errorMessage = (err: unknown) => (err instanceof ApiError ? err.message : "Something went wrong");

/** Any transaction write moves an account balance and the monthly summary. */
function useInvalidateTransactions() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  };
}

export function useCreateTransaction() {
  const invalidate = useInvalidateTransactions();
  return useMutation({
    mutationFn: (data: TransactionCreate) => transactionsApi.create(data),
    onSuccess: (txn) => {
      invalidate();
      toast.success("Transaction added", {
        description: txn.category
          ? `${txn.category.icon} ${txn.category.name}${txn.ai_suggested ? " · AI suggested" : ""}`
          : undefined,
      });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}

export function useUpdateTransaction() {
  const invalidate = useInvalidateTransactions();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TransactionUpdate }) => transactionsApi.update(id, data),
    onSuccess: () => {
      invalidate();
      toast.success("Transaction updated");
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}

/** One-click category correction — the blueprint's "AI suggests, you decide" rule. */
export function useRecategorize() {
  const invalidate = useInvalidateTransactions();
  return useMutation({
    mutationFn: ({ id, category_id }: { id: number; category_id: number }) =>
      transactionsApi.update(id, { category_id }),
    onSuccess: (txn) => {
      invalidate();
      toast.success(`Filed under ${txn.category?.icon ?? ""} ${txn.category?.name ?? "category"}`);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}

export function useDeleteTransaction() {
  const invalidate = useInvalidateTransactions();
  return useMutation({
    mutationFn: (id: number) => transactionsApi.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Transaction deleted", { description: "Account balance restored." });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}
