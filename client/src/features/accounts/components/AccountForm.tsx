"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { ApiError } from "@/lib/api-client";
import { ACCOUNT_TYPE_LABELS } from "@/lib/format";
import type { Account, AccountType } from "@/lib/types";
import { Button, ErrorBanner, FieldError, Input, Label, Select, Spinner } from "@/components/ui";
import { useCreateAccount, useUpdateAccount } from "../hooks";

const ACCOUNT_TYPES = Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[];

const schema = z.object({
  name: z.string().min(1, "Required").max(120),
  type: z.enum(["cash", "bank", "credit", "mobile", "savings"]),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "3-letter code, e.g. BDT"),
  balance: z.coerce.number().multipleOf(0.01, "Max 2 decimals"),
});
type FormValues = z.infer<typeof schema>;

interface AccountFormProps {
  /** When set, the form edits this account (opening balance is locked). */
  account?: Account;
  onDone: () => void;
}

export function AccountForm({ account, onDone }: AccountFormProps) {
  const create = useCreateAccount();
  const update = useUpdateAccount();
  const mutation = account ? update : create;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: account
      ? { name: account.name, type: account.type, currency: account.currency, balance: account.balance }
      : { name: "", type: "cash", currency: "BDT", balance: 0 },
  });

  async function onSubmit(values: FormValues) {
    if (account) {
      await update.mutateAsync({
        id: account.id,
        data: { name: values.name, type: values.type, currency: values.currency },
      });
    } else {
      await create.mutateAsync(values);
    }
    onDone();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="acct-name">Name</Label>
        <Input id="acct-name" placeholder="e.g. DBBL, bKash" {...register("name")} />
        <FieldError message={errors.name?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="acct-type">Type</Label>
          <Select id="acct-type" {...register("type")}>
            {ACCOUNT_TYPES.map((t) => (
              <option key={t} value={t}>
                {ACCOUNT_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="acct-currency">Currency</Label>
          <Input id="acct-currency" maxLength={3} {...register("currency")} />
          <FieldError message={errors.currency?.message} />
        </div>
      </div>

      <div>
        <Label htmlFor="acct-balance">{account ? "Balance" : "Opening balance"}</Label>
        <Input id="acct-balance" type="number" step="0.01" disabled={!!account} {...register("balance")} />
        <FieldError message={errors.balance?.message} />
        {account && (
          <p className="mt-1 text-xs text-slate-500">Balance moves only through transactions.</p>
        )}
      </div>

      <ErrorBanner
        message={
          mutation.isError
            ? mutation.error instanceof ApiError
              ? mutation.error.message
              : "Something went wrong"
            : null
        }
      />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending} className="flex items-center gap-2">
          {mutation.isPending && <Spinner className="h-4 w-4" />}
          {account ? "Save" : "Create account"}
        </Button>
      </div>
    </form>
  );
}
