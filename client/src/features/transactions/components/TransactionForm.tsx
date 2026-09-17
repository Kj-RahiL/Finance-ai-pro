"use client";

import { useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles, Trash2 } from "lucide-react";

import { currencySymbol, todayISO } from "@/lib/format";
import type { Transaction } from "@/lib/types";
import { Button, Field, Input, Segmented, Select } from "@/components/ui";
import { useAccounts } from "@/features/accounts/hooks";
import { useCategories } from "@/features/categories/hooks";
import { useCreateTransaction, useUpdateTransaction } from "../hooks";

const AUTO = "auto"; // sentinel: let the AI choose

const schema = z.object({
  description: z.string().trim().min(1, "What was this for?").max(255),
  amount: z.coerce.number({ invalid_type_error: "Enter an amount" }).positive("Must be greater than 0").multipleOf(0.01, "Max 2 decimals"),
  type: z.enum(["expense", "income"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  account_id: z.coerce.number().int().positive("Pick an account"),
  category_id: z.string(), // AUTO or a numeric id
});
type FormValues = z.infer<typeof schema>;

interface TransactionFormProps {
  /** When set, edits this transaction instead of creating one. */
  transaction?: Transaction;
  /** Pre-select an account (e.g. when opened from an account page). */
  defaultAccountId?: number;
  /** Edit mode only: shows a Delete action (parent owns the confirm dialog). */
  onDelete?: (txn: Transaction) => void;
  onDone: () => void;
}

export function TransactionForm({ transaction, defaultAccountId, onDelete, onDone }: TransactionFormProps) {
  const { data: accounts = [] } = useAccounts();
  const create = useCreateTransaction();
  const update = useUpdateTransaction();
  const mutation = transaction ? update : create;

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    setFocus,
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
      : { description: "", type: "expense", date: todayISO(), account_id: defaultAccountId, category_id: AUTO },
  });

  const type = watch("type");
  const accountId = watch("account_id");
  const categoryId = watch("category_id");
  const { data: categories = [] } = useCategories(type);
  const account = accounts.find((a) => a.id === Number(accountId));

  useEffect(() => setFocus("description"), [setFocus]);

  // Default the account once the list loads (create mode only).
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

    try {
      if (transaction) {
        // Sending category_id marks it user-confirmed (ai_suggested → false), so only
        // send it when the user actually changed it.
        const unchanged = category_id === (transaction.category?.id ?? undefined);
        await update.mutateAsync({ id: transaction.id, data: unchanged ? { ...payload, category_id: undefined } : payload });
      } else {
        await create.mutateAsync(payload);
      }
      onDone();
    } catch {
      /* toast shown by the mutation hook */
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Controller
        control={control}
        name="type"
        render={({ field }) => (
          <Segmented
            aria-label="Type"
            value={field.value}
            onChange={field.onChange}
            options={[
              { value: "expense", label: "Expense", tone: "danger" },
              { value: "income", label: "Income", tone: "success" },
            ]}
          />
        )}
      />

      <Field label="Description" htmlFor="txn-description" error={errors.description?.message}>
        <Input id="txn-description" placeholder="e.g. KFC, Uber, bKash bill" autoComplete="off" {...register("description")} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount" htmlFor="txn-amount" error={errors.amount?.message}>
          <Input
            id="txn-amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            leading={currencySymbol(account?.currency)}
            className="tnum"
            {...register("amount")}
          />
        </Field>
        <Field label="Date" htmlFor="txn-date" error={errors.date?.message}>
          <Input id="txn-date" type="date" max={todayISO()} {...register("date")} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Account" htmlFor="txn-account" error={errors.account_id?.message}>
          <Select id="txn-account" {...register("account_id")}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Category"
          htmlFor="txn-category"
          hint={categoryId === AUTO ? "AI picks one; you can change it later." : undefined}
        >
          <Select id="txn-category" {...register("category_id")}>
            <option value={AUTO}>✨ Auto (AI)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        {transaction && onDelete && (
          <Button type="button" variant="danger" className="mr-auto" onClick={() => onDelete(transaction)}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        )}
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={mutation.isPending}>
          {mutation.isPending && categoryId === AUTO && !transaction ? (
            "Categorizing…"
          ) : transaction ? (
            "Save changes"
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Add transaction
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
