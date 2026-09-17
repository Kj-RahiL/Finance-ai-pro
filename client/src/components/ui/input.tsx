"use client";

import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

const fieldBase =
  "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-fg outline-none transition " +
  "placeholder:text-fg-subtle hover:border-border-strong " +
  "focus:border-accent focus:ring-2 focus:ring-accent/25 disabled:cursor-not-allowed disabled:opacity-50";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Text/icon rendered inside the field on the left (e.g. a currency symbol or search icon). */
  leading?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, leading, ...props },
  ref,
) {
  if (!leading) return <input ref={ref} {...props} className={cn(fieldBase, className)} />;
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-fg-subtle">
        {leading}
      </span>
      <input ref={ref} {...props} className={cn(fieldBase, "pl-9", className)} />
    </div>
  );
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <div className="relative">
        <select ref={ref} {...props} className={cn(fieldBase, "appearance-none pr-9", className)}>
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle"
          aria-hidden
        />
      </div>
    );
  },
);

export function Label({ children, htmlFor, className }: { children: ReactNode; htmlFor?: string; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn("mb-1.5 block text-xs font-medium uppercase tracking-wide text-fg-muted", className)}>
      {children}
    </label>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-danger">{message}</p>;
}

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}

/** Label + control + error/hint in one block so forms stay consistent. */
export function Field({ label, htmlFor, error, hint, className, children }: FieldProps) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      <FieldError message={error} />
      {!error && hint && <p className="mt-1.5 text-xs text-fg-subtle">{hint}</p>}
    </div>
  );
}
