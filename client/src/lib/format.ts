const formatters = new Map<string, Intl.NumberFormat>();

/** Symbols to force when the runtime's ICU data lacks them (Intl falls back to the code). */
const SYMBOLS: Record<string, string> = { BDT: "৳" };

function applySymbol(text: string, currency: string): string {
  const symbol = SYMBOLS[currency];
  // Intl separates code and number with a (non-breaking) space; the symbol hugs the number.
  return symbol ? text.replace(currency, symbol).replace(/[\s\u00A0]+(?=[\d-])/, "") : text;
}

export function formatMoney(amount: number, currency = "BDT", opts: { compact?: boolean } = {}): string {
  const key = `${currency}:${opts.compact ? "c" : "f"}`;
  let fmt = formatters.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: opts.compact ? 1 : 2,
      notation: opts.compact ? "compact" : "standard",
    });
    formatters.set(key, fmt);
  }
  return applySymbol(fmt.format(amount), currency);
}

/** Signed display: "+৳1,000" for income, "−৳550" for expense. */
export function formatSigned(amount: number, type: "income" | "expense", currency?: string): string {
  return `${type === "income" ? "+" : "−"}${formatMoney(Math.abs(amount), currency)}`;
}

export function currencySymbol(currency = "BDT"): string {
  if (SYMBOLS[currency]) return SYMBOLS[currency];
  return (
    new Intl.NumberFormat("en-BD", { style: "currency", currency, currencyDisplay: "narrowSymbol" })
      .formatToParts(0)
      .find((p) => p.type === "currency")?.value ?? currency
  );
}

export function formatDate(iso: string, style: "short" | "long" = "short"): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-GB", {
    weekday: style === "long" ? "short" : undefined,
    day: "numeric",
    month: "short",
    year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

/** "Today" / "Yesterday" / "Mon, 14 Sep" — for date group headers. */
export function relativeDay(iso: string): string {
  const today = todayISO();
  if (iso === today) return "Today";
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (iso === toISO(y)) return "Yesterday";
  return formatDate(iso, "long");
}

export function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export function toISO(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Today as YYYY-MM-DD in local time (what <input type="date"> expects). */
export function todayISO(): string {
  return toISO(new Date());
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  cash: "Cash",
  bank: "Bank",
  credit: "Credit card",
  mobile: "Mobile wallet",
  savings: "Savings",
};
