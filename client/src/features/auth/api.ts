import { http } from "@/lib/api-client";
import type { AuthResponse, User } from "@/lib/types";

export const authApi = {
  register: (email: string, password: string, name: string) =>
    http.post<AuthResponse>("/auth/register", { email, password, name }),
  login: (email: string, password: string) => http.post<AuthResponse>("/auth/login", { email, password }),
  me: () => http.get<User>("/auth/me"),
};
