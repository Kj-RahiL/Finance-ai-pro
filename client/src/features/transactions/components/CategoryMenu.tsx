"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Transaction } from "@/lib/types";
import { useCategories } from "@/features/categories/hooks";
import { useRecategorize } from "../hooks";

/**
 * The category badge on a row doubles as a picker: click → choose → saved.
 * Only same-type categories are offered (the server rejects mismatches anyway).
 */
export function CategoryMenu({ txn }: { txn: Transaction }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: categories = [] } = useCategories(txn.type);
  const recategorize = useRecategorize();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function pick(category_id: number) {
    setOpen(false);
    if (category_id !== txn.category?.id) recategorize.mutate({ id: txn.id, category_id });
  }

  return (
    <div ref={ref} className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Change category"
        className={cn(
          "inline-flex h-6 max-w-[11rem] items-center gap-1 whitespace-nowrap rounded-full pl-2 pr-1.5 text-[11px] font-medium leading-4 transition",
          txn.ai_suggested
            ? "border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20"
            : "bg-surface-3 text-fg-muted hover:bg-surface-3/70 hover:text-fg",
          recategorize.isPending && "opacity-60",
        )}
      >
        {txn.ai_suggested && <Sparkles className="h-3 w-3" aria-hidden />}
        {txn.category ? (
          <>
            <span aria-hidden>{txn.category.icon}</span>
            <span className="truncate">{txn.category.name}</span>
          </>
        ) : (
          "Uncategorized"
        )}
        <ChevronDown className="h-3 w-3 opacity-70" aria-hidden />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Category"
          className="absolute left-0 top-full z-30 mt-1 max-h-72 w-52 overflow-auto rounded-xl border border-border bg-surface-2 p-1 shadow-pop animate-fade-in"
        >
          {txn.ai_suggested && (
            <li className="px-2 py-1.5 text-[11px] text-fg-subtle">AI suggested — pick to confirm or correct</li>
          )}
          {categories.map((c) => {
            const active = c.id === txn.category?.id;
            return (
              <li key={c.id} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => pick(c.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-surface-3",
                    active ? "text-fg" : "text-fg-muted",
                  )}
                >
                  <span aria-hidden>{c.icon}</span>
                  <span className="flex-1">{c.name}</span>
                  {active && <Check className="h-3.5 w-3.5 text-accent" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
