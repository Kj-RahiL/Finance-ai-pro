"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { ApiError } from "@/lib/api-client";
import { todayISO } from "@/lib/format";
import type { Transaction } from "@/lib/types";
import { Button, ErrorBanner, FieldError, Input, Label, Select, Spinner } from "@/components/ui";
import { useAccounts } from "@/features/accounts/hooks";
import { useCategories } from "@/features/categories/hooks";
import { useCreateTransaction, useUpdateTransaction } from "../hooks";

const AUTO = "auto"; // sentinel: let the AI choose

const schema = z.object({
  description: z.string().min(1, "Required").max(255),
  amount: z.coerce.number().positive("Must be greater than 0").multipleOf(0.01, "Max 2 decimals"),
  type: z.enum(["expense", "income"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  account_id: z.coerce.number().int().positive("Pick an account"),
  category_id: z.string(), // AUTO or a numeric id
});
type FormValues = z.infer<typeof schema>;

interface TransactionFormProps {
  /** When set, edits this transaction instead of creating one. */
  transaction?: Transaction;
  /** Compact single-row layout for the quick-add bar. */
  compact?: boolean;
  onDone?: () => void;
}

export function TransactionForm({ transaction, compact = false, onDone }: TransactionFormProps) {
  const { data: accounts = [] } = useAccounts();
  const create = useCreateTransaction();
  const update = useUpdateTransaction();
  const mutation = transaction ? update : create;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: transaction
      ? {
          description: transaction.description,
          amount: transaction.amount,
          type: transaction.type,
          date: transaction.date,
          account_id: transaction.account_id,
          category_id: transaction.category ? String(transaction.category.id) : AUTO,
        }
      : { description: "", type: "expense", date: todayISO(), category_id: AUTO },
  });

  const type = watch("type");
  const { data: categories = [] } = useCategories(type);

  // Default the account once the list loads (create mode only).
  const accountId = watch("account_id");
  useEffect(() => {
    if (!transaction && !accountId && accounts[0]) setValue("account_id", accounts[0].id);
  }, [accounts, accountId, transaction, setValue]);

  // Switching type invalidates the chosen category (expense ↔ income sets differ).
  const prevType = useRef(type);
  useEffect(() => {
    if (prevType.current !== type) {
      prevType.current = type;
      setValue("category_id", AUTO);
    }
  }, [type, setValue]);

  async function onSubmit(values: FormValues) {
    const category_id = values.category_id === AUTO ? undefined : Number(values.category_id);
    const payload = {
      description: values.description,
      amount: values.amount,
      type: values.type,
      date: values.date,
      account_id: values.account_id,
      category_id,
    };

    if (transaction) {
      // Sending category_id marks the category user-confirmed (ai_suggested → false),
      // so only send it when the user actually changed it — editing the amount alone
      // must not erase the "AI suggested" badge.
      const unchanged = category_id === (transaction.category?.id ?? undefined);
      await update.mutateAsync({
        id: transaction.id,
        data: unchanged ? { ...payload, category_id: undefined } : payload,
      });
    } else {
      await create.mutateAsync(payload);
      reset({ description: "", type: values.type, date: values.date, account_id: values.account_id, category_id: AUTO });
    }
    onDone?.();
  }

  const errorMessage = mutation.isError
    ? mutation.error instanceof ApiError
      ? mutation.error.message
      : "Something went wrong"
    : null;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={compact ? "grid grid-cols-1 gap-3 sm:grid-cols-[1fr_7rem_7rem_9rem]" : "space-y-4"}
      noValidate
    >
      <div>
        <Label htmlFor="txn-description">Description</Label>
        <Input id="txn-description" placeholder="e.g. KFC, Uber, bKash bill" {...register("description")} />
        <FieldError message={errors.description?.message} />
      </div>
      <div>
        <Label htmlFor="txn-amount">Amount</Label>
        <Input id="txn-amount" type="number" step="0.01" min="0" placeholder="550" {...register("amount")} />
        <FieldError message={errors.amount?.message} />
      </div>
      <div>
        <Label htmlFor="txn-type">Type</Label>
        <Select id="txn-type" {...register("type")}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="txn-account">Account</Label>
        <Select id="txn-account" {...register("account_id")}>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
        <FieldError message={errors.account_id?.message} />
      </div>

      <div className={compact ? "sm:col-span-2" : ""}>
        <Label htmlFor="txn-date">Date</Label>
        <Input id="txn-date" type="date" {...register("date")} />
        <FieldError message={errors.date?.message} />
      </div>
      <div className={compact ? "sm:col-span-2" : ""}>
        <Label htmlFor="txn-category">Category</Label>
        <Select id="txn-category" {...register("category_id")}>
          <option value={AUTO}>✨ Auto (AI suggests)</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </Select>
      </div>

      <div className={compact ? "sm:col-span-4 flex items-center gap-3" : "flex items-center justify-end gap-2"}>
        {!compact && (
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={mutation.isPending} className="flex items-center justify-center gap-2">
          {mutation.isPending && <Spinner className="h-4 w-4" />}
          {mutation.isPending ? "Categorizing…" : transaction ? "Save changes" : "Add transaction"}
        </Button>
        <ErrorBanner message={errorMessage} />
      </div>
    </form>
  );
}
