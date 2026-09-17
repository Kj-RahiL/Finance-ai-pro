/** API contracts — mirror server/app/schemas. */

export type CategoryType = "income" | "expense";
export type TransactionType = "income" | "expense";
export type AccountType = "cash" | "bank" | "credit" | "mobile" | "savings";

export interface User {
  id: number;
  email: string;
  name: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Category {
  id: number;
  name: string;
  type: CategoryType;
  icon: string;
  is_default: boolean;
}

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  is_archived: boolean;
  created_at: string;
}

export interface AccountCreate {
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
}

export type AccountUpdate = Partial<Pick<Account, "name" | "type" | "currency" | "is_archived">>;

export interface Transaction {
  id: number;
  account_id: number;
  amount: number;
  description: string;
  type: TransactionType;
  date: string; // YYYY-MM-DD
  ai_suggested: boolean;
  created_at: string;
  updated_at: string;
  category: Category | null;
}

export interface TransactionCreate {
  amount: number;
  description: string;
  type: TransactionType;
  date?: string;
  account_id?: number;
  /** Omit to let the AI pick. */
  category_id?: number;
}

export type TransactionUpdate = Partial<TransactionCreate>;

export interface TransactionFilters {
  account_id?: number;
  category_id?: number;
  type?: TransactionType;
  date_from?: string;
  date_to?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface MonthlySummary {
  year: number;
  month: number;
  income: number;
  expense: number;
  net: number;
  transaction_count: number;
  total_balance: number;
}

export interface CategorySpend {
  category_id: number | null;
  name: string;
  icon: string;
  total: number;
  count: number;
  /** Share of the month's expenses, 0–1. */
  share: number;
}

export interface CategoryBreakdown {
  year: number;
  month: number;
  total_expense: number;
  items: CategorySpend[];
}
