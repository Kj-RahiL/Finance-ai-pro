"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { AccountCreate, AccountUpdate } from "@/lib/types";
import { accountsApi } from "./api";

export function useAccounts(includeArchived = false) {
  return useQuery({
    queryKey: queryKeys.accounts(includeArchived),
    queryFn: () => accountsApi.list(includeArchived),
  });
}

/** Balances change with every transaction, so every account mutation refreshes both. */
function useInvalidateAccounts() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };
}

export function useCreateAccount() {
  const invalidate = useInvalidateAccounts();
  return useMutation({
    mutationFn: (data: AccountCreate) => accountsApi.create(data),
    onSuccess: invalidate,
  });
}

export function useUpdateAccount() {
  const invalidate = useInvalidateAccounts();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AccountUpdate }) => accountsApi.update(id, data),
    onSuccess: invalidate,
  });
}

export function useArchiveAccount() {
  const invalidate = useInvalidateAccounts();
  return useMutation({
    mutationFn: (id: number) => accountsApi.archive(id),
    onSuccess: invalidate,
  });
}
