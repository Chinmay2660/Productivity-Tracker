"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import Button from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/30">
        <AlertTriangle className="h-7 w-7 text-amber-500" strokeWidth={1.5} />
      </div>
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-[var(--muted)]">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <Button onClick={reset} className="mt-6">Try again</Button>
    </div>
  );
}
