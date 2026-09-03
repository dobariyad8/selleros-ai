import {
  BarChart3,
  ChartNoAxesCombined,
  CreditCard,
  FileClock,
  FilePlus2,
  FileSearch,
  FolderKanban,
  History,
  ImageIcon,
  LayoutDashboard,
  ListChecks,
  Settings,
  Sparkles,
  Store,
  Tags,
  Trophy,
  type LucideIcon,
} from "lucide-react";

export type NavigationLinkItem = {
  type: "link";
  name: string;
  href: string;
  icon: LucideIcon;
  proOnly?: boolean;
};

export type NavigationGroupItem = {
  type: "group";
  name: string;
  icon: LucideIcon;
  children: NavigationLinkItem[];
};

export type NavigationItem =
  | NavigationLinkItem
  | NavigationGroupItem;

export const navigationItems: NavigationItem[] = [
  {
    type: "link",
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    type: "group",
    name: "Listings",
    icon: ListChecks,
    children: [
      {
        type: "link",
        name: "All Listings",
        href: "/listings",
        icon: ListChecks,
      },
      {
        type: "link",
        name: "Create Listing",
        href: "/create-listing",
        icon: FilePlus2,
        proOnly: true,
      },
      {
        type: "link",
        name: "Listing Projects",
        href: "/listing-projects",
        icon: FolderKanban,
        proOnly: true,
      },
      {
        type: "link",
        name: "Export History",
        href: "/export-history",
        icon: FileClock,
        proOnly: true,
      },
      {
        type: "link",
        name: "Update History",
        href: "/listing-update-history",
        icon: History,
        proOnly: true,
      },
      {
        type: "link",
        name: "Optimization Results",
        href: "/optimization-results",
        icon: ChartNoAxesCombined,
        proOnly: true,
      },
    ],
  },
  {
    type: "link",
    name: "AI Auditor",
    href: "/ai-auditor",
    icon: FileSearch,
  },
  {
    type: "link",
    name: "Recommendations",
    href: "/recommendations",
    icon: Sparkles,
  },
  {
    type: "link",
    name: "Keywords",
    href: "/keywords",
    icon: Tags,
  },
  {
    type: "link",
    name: "Top Performers",
    href: "/top-performers",
    icon: Trophy,
  },
  {
    type: "link",
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    type: "link",
    name: "Images",
    href: "/images",
    icon: ImageIcon,
  },
  {
    type: "link",
    name: "Shop Profile",
    href: "/shop-profile",
    icon: Store,
  },
  {
    type: "link",
    name: "Subscription",
    href: "/subscription",
    icon: CreditCard,
  },
  {
    type: "link",
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

export function isNavigationGroupActive(
  pathname: string,
  item: NavigationGroupItem,
) {
  return item.children.some((child) =>
    isNavigationRouteActive(
      pathname,
      child.href,
    ),
  );
}