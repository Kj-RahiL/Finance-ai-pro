"use client";

/**
 * Last-resort boundary for errors in the root layout itself. It replaces <html>,
 * so it can't use the design system — plain inline styles only.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0a0d16", color: "#e6e9f2", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
          <div>
            <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>FinanceAI Pro couldn&apos;t start</h1>
            <p style={{ color: "#9aa3b8", margin: "0 0 20px" }}>
              {error.digest ? `Reference: ${error.digest}` : "An unexpected error occurred while loading the app."}
            </p>
            <button
              onClick={reset}
              style={{ background: "#6d5dfc", color: "#fff", border: 0, borderRadius: 8, padding: "10px 16px", fontWeight: 600, cursor: "pointer" }}
            >
              Reload
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
