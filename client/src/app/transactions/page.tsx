"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { Button, FieldError, Input, Label, Select, Spinner } from "@/components/ui";
import type { Transaction } from "@/lib/types";

const schema = z.object({
  description: z.string().min(1, "Required").max(255),
  amount: z.coerce.number().positive("Must be greater than 0"),
  type: z.enum(["expense", "income"]),
});
type FormValues = z.infer<typeof schema>;

const currency = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 2,
});

export default function TransactionsPage() {
  const router = useRouter();
  const token = useAuth((s) => s.token);
  const user = useAuth((s) => s.user);
  const hydrated = useAuth((s) => s.hydrated);
  const logout = useAuth((s) => s.logout);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (hydrated && !token) router.replace("/login");
  }, [hydrated, token, router]);

  const {
    data: transactions = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["transactions"],
    queryFn: api.listTransactions,
    enabled: hydrated && !!token,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "expense", description: "" },
  });

  const createMutation = useMutation({
    mutationFn: (values: FormValues) =>
      api.createTransaction(values.amount, values.description, values.type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      reset({ type: "expense", description: "", amount: undefined });
    },
  });

  if (!hydrated || (!token && hydrated)) {
    return (
      <div className="grid min-h-screen place-items-center text-slate-400">
        <Spinner />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">FinanceAI Pro</h1>
          {user && <p className="text-sm text-slate-400">Hi, {user.name}</p>}
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            logout();
            router.replace("/login");
          }}
        >
          Log out
        </Button>
      </header>

      {/* Add transaction */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur"
      >
        <h2 className="text-sm font-medium text-slate-300">Add a transaction</h2>
        <form
          onSubmit={handleSubmit((v) => createMutation.mutate(v))}
          className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_8rem_8rem]"
          noValidate
        >
          <div>
            <Label htmlFor="description">Description</Label>
            <Input id="description" placeholder="e.g. KFC, Uber, bKash bill" {...register("description")} />
            <FieldError message={errors.description?.message} />
          </div>
          <div>
            <Label htmlFor="amount">Amount (৳)</Label>
            <Input id="amount" type="number" step="0.01" min="0" placeholder="550" {...register("amount")} />
            <FieldError message={errors.amount?.message} />
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <Select id="type" {...register("type")}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </Select>
          </div>

          <div className="sm:col-span-3">
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="flex items-center justify-center gap-2"
            >
              {createMutation.isPending && <Spinner className="h-4 w-4" />}
              {createMutation.isPending ? "Categorizing…" : "Add transaction"}
            </Button>
            {createMutation.isError && (
              <span className="ml-3 text-sm text-rose-400">
                {createMutation.error instanceof ApiError
                  ? createMutation.error.message
                  : "Failed to add"}
              </span>
            )}
          </div>
        </form>
      </motion.section>

      {/* List */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-slate-400">Recent transactions</h2>

        {isLoading ? (
          <div className="grid place-items-center py-12 text-slate-500">
            <Spinner />
          </div>
        ) : isError ? (
          <p className="py-8 text-center text-rose-400">Couldn&apos;t load transactions.</p>
        ) : transactions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-800 py-10 text-center text-slate-500">
            No transactions yet. Add your first one above.
          </p>
        ) : (
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {transactions.map((txn) => (
                <TransactionRow key={txn.id} txn={txn} />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>
    </main>
  );
}

function TransactionRow({ txn }: { txn: Transaction }) {
  const isIncome = txn.type === "income";
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3"
    >
      <div className="min-w-0">
        <p className="truncate font-medium text-slate-100">{txn.description}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {txn.category && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
              <span aria-hidden>{txn.category.icon}</span>
              {txn.category.name}
            </span>
          )}
          {txn.ai_suggested && (
            <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-300">
              ✨ AI suggested
            </span>
          )}
        </div>
      </div>
      <div className={`shrink-0 pl-3 text-right font-semibold ${isIncome ? "text-emerald-400" : "text-slate-200"}`}>
        {isIncome ? "+" : "-"}
        {currency.format(txn.amount)}
      </div>
    </motion.li>
  );
}
