"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";

import { StatusPage } from "@/components/layout/StatusPage";
import { Button } from "@/components/ui";

/** Catches render/runtime errors in any route segment; `reset` re-renders the segment. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      icon={TriangleAlert}
      code="Something broke"
      title="We hit an unexpected error"
      description="It's been logged. Trying again usually fixes it; if not, reload the page."
      detail={error.digest ? `ref: ${error.digest}` : process.env.NODE_ENV === "development" ? error.message : undefined}
      actions={
        <>
          <Button onClick={reset}>Try again</Button>
          <Button asChild variant="ghost">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </>
      }
    />
  );
}
