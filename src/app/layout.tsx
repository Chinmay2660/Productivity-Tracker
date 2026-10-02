import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import NavBar from "@/components/common/NavBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Technical Productivity Tracker",
  description: "Track DSA, JS Problem Solving, System Design and any custom subject progress",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased">
        <NavBar />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
