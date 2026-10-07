import type { Metadata } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider, ThemeSync } from "@/components/providers/ThemeProvider";
import { UserProvider } from "@/components/providers/UserProvider";
import AppShell from "@/components/layout/AppShell";
import ClientToaster from "@/components/ui/ClientToaster";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const themeScript = `(function(){try{var t=localStorage.getItem("growthhub-theme")||localStorage.getItem("switch-theme");var d=window.matchMedia("(prefers-color-scheme: dark)").matches;if(t==="dark"||(t!=="light"&&d))document.documentElement.classList.add("dark")}catch(e){}})();`;

export const metadata: Metadata = {
  title: "GrowthHub",
  description: "Track questions, stay accountable with your group, and grow toward your career goals.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable} suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-[var(--background)] font-sans antialiased text-[var(--foreground)]"
      >
        <Script id="growthhub-theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <ThemeProvider>
          <UserProvider>
            <ThemeSync />
            <AppShell>{children}</AppShell>
            <ClientToaster />
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
