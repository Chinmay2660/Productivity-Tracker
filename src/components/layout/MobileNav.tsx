"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { ExternalLink } from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";
import { openCareerFlow } from "@/lib/apps-client";
import { buildMobileNav, isExternalNavItem, isNavItemActive } from "./nav-config";

export default function MobileNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const nav = buildMobileNav(user?.activeGroupId);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-lg lg:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {nav.map((item) => {
          const active = !isExternalNavItem(item) && isNavItemActive(pathname, item.href);
          const Icon = item.icon;
          const className = clsx(
            "flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors",
            active ? "text-brand" : "text-[var(--muted)]"
          );

          if (isExternalNavItem(item)) {
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => openCareerFlow()}
                className={className}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                  <ExternalLink
                    className="absolute -right-1 -top-1 h-2.5 w-2.5 opacity-60"
                    aria-hidden
                  />
                </span>
                {item.shortLabel ?? item.label}
              </button>
            );
          }

          return (
            <Link key={item.href} href={item.href} className={className}>
              <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
              {item.shortLabel ?? item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
