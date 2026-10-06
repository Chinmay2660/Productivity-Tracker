import {
  LayoutDashboard,
  CircleHelp,
  ListChecks,
  Users,
  TrendingUp,
  Settings,
  BookOpen,
  Briefcase,
  Mic,
  type LucideIcon,
} from "lucide-react";

export const EXTERNAL_CAREERFLOW_HREF = "__external:careerflow";

export type NavItem = {
  href: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  external?: boolean;
};

export function isExternalNavItem(item: NavItem): boolean {
  return item.external === true || item.href.startsWith("__external:");
}

/** Group overview is exact-match only so mock-interviews doesn't light up both items. */
export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/groups") return pathname === "/groups";
  if (/^\/groups\/[^/]+\/mock-interviews$/.test(href)) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  if (/^\/groups\/[^/]+$/.test(href)) return pathname === href;
  if (href === "/dashboard") return pathname === href || pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getGroupNavHref(activeGroupId?: string): string {
  return activeGroupId ? `/groups/${activeGroupId}` : "/groups";
}

export function getMockInterviewsNavHref(activeGroupId?: string): string {
  return activeGroupId ? `/groups/${activeGroupId}/mock-interviews` : "/groups";
}

export function buildMainNav(activeGroupId?: string): NavItem[] {
  return [
    { href: "/dashboard", label: "Dashboard", shortLabel: "Dashboard", icon: LayoutDashboard },
    { href: getGroupNavHref(activeGroupId), label: "Group", shortLabel: "Group", icon: Users },
    {
      href: getMockInterviewsNavHref(activeGroupId),
      label: "Mock Interviews",
      shortLabel: "Mocks",
      icon: Mic,
    },
    { href: "/questions", label: "Questions", icon: CircleHelp },
    { href: "/subjects", label: "Tracks", icon: BookOpen },
    { href: "/tasks", label: "Tasks", icon: ListChecks },
    { href: "/groups", label: "All Groups", icon: Users },
    { href: "/analytics", label: "Analytics", icon: TrendingUp },
    {
      href: EXTERNAL_CAREERFLOW_HREF,
      label: "CareerFlow",
      shortLabel: "Jobs",
      icon: Briefcase,
      external: true,
    },
    { href: "/settings", label: "Settings", shortLabel: "More", icon: Settings },
  ];
}

export const MAIN_NAV: NavItem[] = buildMainNav();

export function buildMobileNav(activeGroupId?: string): NavItem[] {
  const nav = buildMainNav(activeGroupId);
  return nav.filter((item) =>
    ["/dashboard", "/questions", "/tasks", EXTERNAL_CAREERFLOW_HREF, "/settings"].includes(item.href)
  );
}

export const MOBILE_NAV = buildMobileNav();
