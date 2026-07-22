import {
  BarChart3,
  FileSearch,
  ImageIcon,
  LayoutDashboard,
  ListChecks,
  Settings,
  Sparkles,
  Tags,
  Trophy,
  type LucideIcon,
} from "lucide-react";

export type NavigationItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

export const navigationItems: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Listings",
    href: "/listings",
    icon: ListChecks,
  },
  {
    name: "AI Auditor",
    href: "/ai-auditor",
    icon: FileSearch,
  },
  {
    name: "Recommendations",
    href: "/recommendations",
    icon: Sparkles,
  },
  {
    name: "Keywords",
    href: "/keywords",
    icon: Tags,
  },
  {
    name: "Top Performers",
    href: "/top-performers",
    icon: Trophy,
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    name: "Images",
    href: "/images",
    icon: ImageIcon,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function isNavigationRouteActive(
  pathname: string,
  href: string,
) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  if (href === "/listings") {
    return (
      pathname === "/listings" ||
      pathname.startsWith("/listings/")
    );
  }

  if (href === "/ai-auditor") {
    return (
      pathname === "/ai-auditor" ||
      pathname.startsWith("/audit/")
    );
  }

  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}