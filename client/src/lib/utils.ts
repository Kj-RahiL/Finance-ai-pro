import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes; later classes win (so callers can override defaults). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
