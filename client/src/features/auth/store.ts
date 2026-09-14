import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { User } from "@/lib/types";

interface AuthState {
  token: string | null;
  user: User | null;
  /** True once zustand has rehydrated from localStorage (avoids SSR flicker). */
  hydrated: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  setHydrated: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      hydrated: false,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "financeai-auth",
      partialize: (state) => ({ token: state.token, user: state.user }),
      // Runs after rehydration; the action closes over `set` so it notifies subscribers.
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
