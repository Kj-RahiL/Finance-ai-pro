"use client";

import type { Account, Category, TransactionFilters as Filters } from "@/lib/types";
import { Button, Input, Select } from "@/components/ui";

interface TransactionFiltersProps {
  value: Filters;
  onChange: (next: Filters) => void;
  accounts: Account[];
  categories: Category[];
}

const num = (v: string) => (v ? Number(v) : undefined);

export function TransactionFilters({ value, onChange, accounts, categories }: TransactionFiltersProps) {
  // Every change resets paging — a new filter is a new result set.
  const set = (patch: Partial<Filters>) => onChange({ ...value, ...patch, offset: 0 });
  const isFiltered = Boolean(
    value.q || value.account_id || value.category_id || value.type || value.date_from || value.date_to,
  );

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      <Input
        placeholder="Search…"
        value={value.q ?? ""}
        onChange={(e) => set({ q: e.target.value || undefined })}
        className="col-span-2 sm:col-span-3 lg:col-span-2"
        aria-label="Search description"
      />
      <Select value={value.type ?? ""} onChange={(e) => set({ type: (e.target.value || undefined) as Filters["type"] })} aria-label="Type">
        <option value="">All types</option>
        <option value="expense">Expense</option>
        <option value="income">Income</option>
      </Select>
      <Select value={value.account_id ?? ""} onChange={(e) => set({ account_id: num(e.target.value) })} aria-label="Account">
        <option value="">All accounts</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </Select>
      <Select value={value.category_id ?? ""} onChange={(e) => set({ category_id: num(e.target.value) })} aria-label="Category">
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.icon} {c.name}
          </option>
        ))}
      </Select>
      <div className="col-span-2 flex items-center gap-2 sm:col-span-3 lg:col-span-1">
        <Input type="date" value={value.date_from ?? ""} onChange={(e) => set({ date_from: e.target.value || undefined })} aria-label="From date" />
        <span className="text-slate-500">–</span>
        <Input type="date" value={value.date_to ?? ""} onChange={(e) => set({ date_to: e.target.value || undefined })} aria-label="To date" />
      </div>
      {isFiltered && (
        <div className="col-span-2 sm:col-span-3 lg:col-span-6">
          <Button variant="ghost" size="sm" onClick={() => onChange({ limit: value.limit, offset: 0 })}>
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
