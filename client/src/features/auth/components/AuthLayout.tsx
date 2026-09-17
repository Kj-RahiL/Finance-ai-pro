"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BrainCircuit, ShieldCheck, Wallet } from "lucide-react";

import { Brand } from "@/components/layout/AppShell";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  footer: { text: string; linkLabel: string; href: string };
  children: ReactNode;
}

const PITCH = [
  { icon: BrainCircuit, title: "Type it, we file it", text: "“KFC 550” becomes a categorized expense — Claude does the sorting." },
  { icon: Wallet, title: "Every account, one balance", text: "Cash, bank, bKash, savings — running balances that stay correct." },
  { icon: ShieldCheck, title: "AI suggests, you decide", text: "Every AI choice is marked and editable. Nothing is silently assumed." },
];

/** Split-screen shell for login / register: product pitch left, form right. */
export function AuthLayout({ title, subtitle, footer, children }: AuthLayoutProps) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-surface/40 p-10 lg:flex">
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-success/10 blur-3xl" />

        <div className="relative">
          <Brand size="lg" />
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            Your money, understood — <span className="text-accent">automatically.</span>
          </h2>
          <ul className="mt-8 space-y-5">
            {PITCH.map(({ icon: Icon, title: t, text }) => (
              <li key={t} className="flex gap-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-3 text-accent">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-medium text-fg">{t}</p>
                  <p className="text-sm text-fg-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-fg-subtle">Built for Bangladesh · BDT-first</p>
      </section>

      <section className="grid place-items-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="mb-8 lg:hidden">
            <Brand />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-fg-muted">{subtitle}</p>

          {children}

          <p className="mt-8 text-center text-sm text-fg-muted">
            {footer.text}{" "}
            <Link href={footer.href} className="font-medium text-accent hover:underline">
              {footer.linkLabel}
            </Link>
          </p>
        </motion.div>
      </section>
    </main>
  );
}
