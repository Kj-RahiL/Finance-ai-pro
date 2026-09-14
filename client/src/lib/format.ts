const formatters = new Map<string, Intl.NumberFormat>();

export function formatMoney(amount: number, currency = "BDT"): string {
  let fmt = formatters.get(currency);
  if (!fmt) {
    fmt = new Intl.NumberFormat("en-BD", { style: "currency", currency, maximumFractionDigits: 2 });
    formatters.set(currency, fmt);
  }
  return fmt.format(amount);
}

/** Signed display: "+৳1,000" for income, "-৳550" for expense. */
export function formatSigned(amount: number, type: "income" | "expense", currency?: string): string {
  return `${type === "income" ? "+" : "-"}${formatMoney(amount, currency)}`;
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

/** Today as YYYY-MM-DD in local time (what <input type="date"> expects). */
export function todayISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  cash: "Cash",
  bank: "Bank",
  credit: "Credit card",
  mobile: "Mobile wallet",
  savings: "Savings",
};
