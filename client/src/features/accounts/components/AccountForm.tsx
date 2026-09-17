"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { ACCOUNT_TYPE_LABELS, currencySymbol } from "@/lib/format";
import type { Account, AccountType } from "@/lib/types";
import { Button, Field, Input, Select } from "@/components/ui";
import { useCreateAccount, useUpdateAccount } from "../hooks";

const ACCOUNT_TYPES = Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[];

const schema = z.object({
  name: z.string().trim().min(1, "Give it a name").max(120),
  type: z.enum(["cash", "bank", "credit", "mobile", "savings"]),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "3-letter code, e.g. BDT"),
  balance: z.coerce.number({ invalid_type_error: "Enter a number" }).multipleOf(0.01, "Max 2 decimals"),
});
type FormValues = z.infer<typeof schema>;

interface AccountFormProps {
  /** When set, the form edits this account (balance is locked; it only moves via transactions). */
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
    watch,
    setFocus,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: account
      ? { name: account.name, type: account.type, currency: account.currency, balance: account.balance }
      : { name: "", type: "cash", currency: "BDT", balance: 0 },
  });

  useEffect(() => setFocus("name"), [setFocus]);
  const currency = watch("currency");

  async function onSubmit(values: FormValues) {
    try {
      if (account) {
        await update.mutateAsync({ id: account.id, data: { name: values.name, type: values.type, currency: values.currency } });
      } else {
        await create.mutateAsync(values);
      }
      onDone();
    } catch {
      /* toast shown by the mutation hook */
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field label="Name" htmlFor="acct-name" error={errors.name?.message}>
        <Input id="acct-name" placeholder="e.g. DBBL, bKash, Wallet" autoComplete="off" {...register("name")} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Type" htmlFor="acct-type">
          <Select id="acct-type" {...register("type")}>
            {ACCOUNT_TYPES.map((t) => (
              <option key={t} value={t}>
                {ACCOUNT_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Currency" htmlFor="acct-currency" error={errors.currency?.message}>
          <Input id="acct-currency" maxLength={3} className="uppercase" {...register("currency")} />
        </Field>
      </div>

      <Field
        label={account ? "Balance" : "Opening balance"}
        htmlFor="acct-balance"
        error={errors.balance?.message}
        hint={account ? "Balance only moves through transactions." : "How much is in it right now."}
      >
        <Input
          id="acct-balance"
          type="number"
          inputMode="decimal"
          step="0.01"
          disabled={!!account}
          leading={currencySymbol(/^[A-Z]{3}$/.test(currency ?? "") ? currency : "BDT")}
          className="tnum"
          {...register("balance")}
        />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={mutation.isPending}>
          {account ? "Save changes" : "Create account"}
        </Button>
      </div>
    </form>
  );
}
