"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface AuthCardProps {
  title: string;
  subtitle: string;
  footer: { text: string; linkLabel: string; href: string };
  children: ReactNode;
}

/** Shared shell for the login / register screens. */
export function AuthCard({ title, subtitle, footer, children }: AuthCardProps) {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl backdrop-blur"
      >
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>

        {children}

        <p className="mt-6 text-center text-sm text-slate-400">
          {footer.text}{" "}
          <Link href={footer.href} className="font-medium text-indigo-400 hover:text-indigo-300">
            {footer.linkLabel}
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
