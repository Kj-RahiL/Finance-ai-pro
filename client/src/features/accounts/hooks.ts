"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { AccountCreate, AccountUpdate } from "@/lib/types";
import { accountsApi } from "./api";

const errorMessage = (err: unknown) => (err instanceof ApiError ? err.message : "Something went wrong");

export function useAccounts(includeArchived = false) {
  return useQuery({
    queryKey: queryKeys.accounts(includeArchived),
    queryFn: () => accountsApi.list(includeArchived),
  });
}

export function useAccount(id: number) {
  return useQuery({
    queryKey: queryKeys.account(id),
    queryFn: () => accountsApi.get(id),
    enabled: Number.isFinite(id) && id > 0,
    retry: (count, err) => !(err instanceof ApiError && err.status === 404) && count < 1,
  });
}

/** Balances change with every transaction, so every account mutation refreshes both. */
function useInvalidateAccounts() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  };
}

export function useCreateAccount() {
  const invalidate = useInvalidateAccounts();
  return useMutation({
    mutationFn: (data: AccountCreate) => accountsApi.create(data),
    onSuccess: (a) => {
      invalidate();
      toast.success(`Account "${a.name}" created`);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}

export function useUpdateAccount() {
  const invalidate = useInvalidateAccounts();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AccountUpdate }) => accountsApi.update(id, data),
    onSuccess: (a, { data }) => {
      invalidate();
      toast.success(data.is_archived === false ? `"${a.name}" restored` : "Account updated");
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}

export function useArchiveAccount() {
  const invalidate = useInvalidateAccounts();
  return useMutation({
    mutationFn: (id: number) => accountsApi.archive(id),
    onSuccess: (a) => {
      invalidate();
      toast.success(`"${a.name}" archived`, { description: "History kept; no new transactions." });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}
