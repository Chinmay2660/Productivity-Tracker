import Link from "next/link";
import { FileQuestion } from "lucide-react";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--surface-muted)]">
        <FileQuestion className="h-8 w-8 text-[var(--muted)]" strokeWidth={1.5} />
      </div>
      <p className="mt-4 text-6xl font-bold text-stone-200 dark:text-[var(--foreground)]">404</p>
      <h1 className="mt-4 text-2xl font-bold text-[var(--foreground)]">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-[var(--muted)]">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/dashboard" className="mt-6">
        <Button>Back to Dashboard</Button>
      </Link>
    </div>
  );
}
