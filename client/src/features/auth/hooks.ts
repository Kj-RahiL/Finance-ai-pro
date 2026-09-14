"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "./store";

/**
 * Gate a page behind auth. Returns `ready` once the persisted session has
 * loaded and a token exists; otherwise redirects to /login.
 */
export function useRequireAuth(): { ready: boolean } {
  const router = useRouter();
  const token = useAuth((s) => s.token);
  const hydrated = useAuth((s) => s.hydrated);

  useEffect(() => {
    if (hydrated && !token) router.replace("/login");
  }, [hydrated, token, router]);

  return { ready: hydrated && !!token };
}

/** Inverse guard for /login and /register: bounce signed-in users to the app. */
export function useRedirectIfAuthed(to = "/dashboard") {
  const router = useRouter();
  const token = useAuth((s) => s.token);
  const hydrated = useAuth((s) => s.hydrated);

  useEffect(() => {
    if (hydrated && token) router.replace(to);
  }, [hydrated, token, router, to]);
}

export function useLogout() {
  const router = useRouter();
  const logout = useAuth((s) => s.logout);
  const queryClient = useQueryClient();

  return () => {
    logout();
    queryClient.clear(); // never leak one user's cached data into the next session
    router.replace("/login");
  };
}
