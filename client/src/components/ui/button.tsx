"use client";

import { cloneElement, forwardRef, isValidElement } from "react";
import type { ButtonHTMLAttributes, ReactElement } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
  /** Render the single child (e.g. a <Link>) with button styling instead of a <button>. */
  asChild?: boolean;
}

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-accent text-accent-fg hover:bg-accent/90 shadow-[0_0_0_1px_hsl(var(--accent)/0.4),0_8px_20px_-8px_hsl(var(--accent)/0.6)]",
  secondary: "bg-surface-3 text-fg hover:bg-surface-3/80 border border-border",
  outline: "border border-border-strong text-fg hover:bg-surface-2",
  ghost: "text-fg-muted hover:bg-surface-2 hover:text-fg",
  danger: "text-danger hover:bg-danger/10",
};

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-base gap-2",
  icon: "h-9 w-9 p-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading = false, asChild = false, disabled, children, ...props },
  ref,
) {
  const classes = cn(
    "inline-flex select-none items-center justify-center whitespace-nowrap rounded-lg font-medium transition",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
    "disabled:cursor-not-allowed disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string }>;
    return cloneElement(child, { ...props, className: cn(classes, child.props.className) });
  }

  return (
    <button ref={ref} disabled={disabled || loading} {...props} className={classes}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});
