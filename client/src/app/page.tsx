"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { FullScreenSpinner } from "@/components/ui";
import { useAuth } from "@/features/auth/store";

export default function Home() {
  const router = useRouter();
  const token = useAuth((s) => s.token);
  const hydrated = useAuth((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    router.replace(token ? "/dashboard" : "/login");
  }, [hydrated, token, router]);

  return <FullScreenSpinner />;
}
