"use client";

import { Toaster } from "react-hot-toast";

export default function ClientToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        className:
          "!rounded-xl !shadow-soft !border !border-[var(--border)] !bg-[var(--card)] !text-sm !text-[var(--foreground)]",
      }}
    />
  );
}
