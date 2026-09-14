"use client";

import { forwardRef, useEffect } from "react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

const fieldBase =
  "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none transition " +
  "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} {...props} className={cn(fieldBase, "placeholder:text-slate-500", className)} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select ref={ref} {...props} className={cn(fieldBase, className)}>
        {children}
      </select>
    );
  },
);

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger";
  size?: "sm" | "md";
}

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  const styles = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-500",
    ghost: "bg-transparent text-slate-300 hover:bg-slate-800",
    danger: "bg-transparent text-rose-300 hover:bg-rose-500/10",
  }[variant];
  const sizing = size === "sm" ? "px-2.5 py-1 text-sm" : "px-4 py-2";

  return (
    <button
      {...props}
      className={cn(
        "rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        sizing,
        styles,
        className,
      )}
    />
  );
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-slate-300">
      {children}
    </label>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-rose-400">{message}</p>;
}

export function ErrorBanner({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
      {message}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("h-5 w-5 animate-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
  );
}

export function FullScreenSpinner() {
  return (
    <div className="grid min-h-screen place-items-center text-slate-400">
      <Spinner />
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur", className)}
    >
      {children}
    </motion.section>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-medium text-slate-400">{children}</h2>
      {action}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "ai" | "success" | "muted";
}) {
  const styles = {
    neutral: "bg-slate-800 text-slate-300",
    ai: "border border-indigo-500/40 bg-indigo-500/10 text-indigo-300",
    success: "bg-emerald-500/10 text-emerald-300",
    muted: "bg-slate-800/60 text-slate-500",
  }[tone];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", styles)}>
      {children}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-slate-800 py-10 text-center text-slate-500">{children}</p>
  );
}

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Minimal accessible dialog: Esc / backdrop closes, content is a card. */
export function Modal({ open, title, onClose, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{title}</h2>
              <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
                ✕
              </Button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
