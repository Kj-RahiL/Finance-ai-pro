import type { Metadata } from "next";
import Link from "next/link";
import { Compass } from "lucide-react";

import { StatusPage } from "@/components/layout/StatusPage";
import { Button } from "@/components/ui";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <StatusPage
      icon={Compass}
      code="404"
      title="This page doesn't exist"
      description="The link may be old, or the address was mistyped. Your money is still where you left it."
      actions={
        <>
          <Button asChild>
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/transactions">View transactions</Link>
          </Button>
        </>
      }
    />
  );
}
