import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import NavBar from "@/components/common/NavBar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Technical Productivity Tracker",
  description: "Track DSA, JS Problem Solving, System Design and any custom subject progress",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#f5f7fb] font-sans antialiased">
        <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-brand-blue/[0.06] to-transparent" />
        <NavBar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
        <Toaster
          position="top-right"
          toastOptions={{
            className: "!rounded-xl !shadow-soft !border !border-slate-100 !text-sm",
          }}
        />
      </body>
    </html>
  );
}
