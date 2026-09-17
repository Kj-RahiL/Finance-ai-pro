import { FullScreenSpinner } from "@/components/ui";

/** Root-level route transition fallback (auth pages, redirects). */
export default function Loading() {
  return <FullScreenSpinner />;
}
