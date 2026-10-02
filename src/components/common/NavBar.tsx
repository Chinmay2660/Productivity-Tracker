"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/questions", label: "Questions", icon: "📝" },
  { href: "/people", label: "People", icon: "👥" },
  { href: "/categories", label: "Subjects", icon: "📚" },
  { href: "/analytics", label: "Analytics", icon: "📈" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/75 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient text-sm font-bold text-white shadow-sm">
            PT
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-slate-900">
            Productivity Tracker
          </span>
        </Link>
        <nav className="flex flex-wrap gap-1 rounded-xl bg-slate-100/70 p-1">
          {LINKS.map((link) => {
            const active = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <span className="text-[13px] leading-none">{link.icon}</span>
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
