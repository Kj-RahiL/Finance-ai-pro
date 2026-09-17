"use client";

import { Search, X } from "lucide-react";

import type { Account, Category, TransactionFilters as Filters } from "@/lib/types";
import { Button, Input, Segmented, Select } from "@/components/ui";

interface TransactionFiltersProps {
  value: Filters;
  onChange: (next: Filters) => void;
  accounts: Account[];
  categories: Category[];
}

const num = (v: string) => (v ? Number(v) : undefined);
type TypeChoice = "all" | "expense" | "income";

export function isFiltered(f: Filters): boolean {
  return Boolean(f.q || f.account_id || f.category_id || f.type || f.date_from || f.date_to);
}

export function TransactionFilters({ value, onChange, accounts, categories }: TransactionFiltersProps) {
  // Every change resets paging — a new filter is a new result set.
  const set = (patch: Partial<Filters>) => onChange({ ...value, ...patch, offset: 0 });
  const visibleCategories = value.type ? categories.filter((c) => c.type === value.type) : categories;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          leading={<Search className="h-4 w-4" />}
          placeholder="Search descriptions…"
          value={value.q ?? ""}
          onChange={(e) => set({ q: e.target.value || undefined })}
          aria-label="Search"
          className="sm:flex-1"
        />
        <Segmented<TypeChoice>
          aria-label="Type"
          className="sm:w-64"
          value={value.type ?? "all"}
          onChange={(t) => set({ type: t === "all" ? undefined : t, category_id: undefined })}
          options={[
            { value: "all", label: "All" },
            { value: "expense", label: "Expense", tone: "danger" },
            { value: "income", label: "Income", tone: "success" },
          ]}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
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
          {visibleCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </Select>
        <Input type="date" value={value.date_from ?? ""} max={value.date_to} onChange={(e) => set({ date_from: e.target.value || undefined })} aria-label="From date" />
        <Input type="date" value={value.date_to ?? ""} min={value.date_from} onChange={(e) => set({ date_to: e.target.value || undefined })} aria-label="To date" />
        {isFiltered(value) && (
          <Button variant="ghost" onClick={() => onChange({ limit: value.limit, offset: 0 })} className="col-span-2 lg:col-span-1">
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
