"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth-store";
import { Spinner } from "@/components/ui";

export default function Home() {
  const router = useRouter();
  const token = useAuth((s) => s.token);
  const hydrated = useAuth((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    router.replace(token ? "/transactions" : "/login");
  }, [hydrated, token, router]);

  return (
    <div className="grid min-h-screen place-items-center text-slate-400">
      <Spinner />
    </div>
  );
}
