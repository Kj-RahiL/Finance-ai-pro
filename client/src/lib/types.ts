export type CategoryType = "income" | "expense";
export type TransactionType = "income" | "expense";

export interface User {
  id: number;
  email: string;
  name: string;
}

export interface Category {
  id: number;
  name: string;
  type: CategoryType;
  icon: string;
}

export interface Transaction {
  id: number;
  amount: number;
  description: string;
  type: TransactionType;
  date: string;
  ai_suggested: boolean;
  created_at: string;
  category: Category | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
