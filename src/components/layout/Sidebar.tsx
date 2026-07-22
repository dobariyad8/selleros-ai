"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";

const navigationItems = [
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
];

const upcomingItems = [
  {
    name: "Analytics",
    icon: BarChart3,
    note: "Coming soon",
  },
  {
    name: "Images",
    icon: ImageIcon,
    note: "Coming soon",
  },
];

function isRouteActive(
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

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary"
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-5" />
          </div>

          <div>
            <p className="font-semibold">
              SellerOS AI
            </p>

            <p className="text-xs text-muted-foreground">
              Etsy Growth Assistant
            </p>
          </div>
        </Link>
      </div>

      <nav
        className="flex-1 overflow-y-auto p-3"
        aria-label="Main navigation"
      >
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            const isActive = isRouteActive(
              pathname,
              item.href,
            );

            return (
              <Link
                key={item.name}
                href={item.href}
                aria-current={
                  isActive ? "page" : undefined
                }
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="size-4 shrink-0" />

                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-6">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Growth Tools
          </p>

          <div className="space-y-1">
            {upcomingItems.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.name}
                  aria-disabled="true"
                  title={item.note}
                  className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground/60"
                >
                  <Icon className="size-4 shrink-0" />

                  <span className="min-w-0 flex-1">
                    {item.name}
                  </span>

                  <span className="max-w-20 truncate text-[10px]">
                    {item.note}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="border-t p-3">
        <div
          aria-disabled="true"
          title="Settings page coming soon"
          className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground/60"
        >
          <Settings className="size-4" />
          Settings

          <span className="ml-auto text-[10px]">
            Soon
          </span>
        </div>
      </div>
    </aside>
  );
}