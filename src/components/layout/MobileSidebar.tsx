"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileSearch,
  ImageIcon,
  LayoutDashboard,
  ListChecks,
  Menu,
  Settings,
  Sparkles,
  Tags,
  Trophy,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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
    name: "Recommendations",
    href: "/recommendations",
    icon: Sparkles,
  },
];

const upcomingItems = [
  {
    name: "AI Auditor",
    icon: FileSearch,
    note: "Open from a listing",
  },
  {
    name: "Analytics",
    icon: BarChart3,
    note: "Coming soon",
  },
  {
    name: "Top Performers",
    icon: Trophy,
    note: "Coming soon",
  },
  {
    name: "Keywords",
    icon: Tags,
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
      pathname.startsWith("/listings/") ||
      pathname.startsWith("/audit/")
    );
  }

  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

export default function MobileSidebar() {
  const pathname = usePathname();

  const [isOpen, setIsOpen] =
    useState(false);

  function closeSidebar() {
    setIsOpen(false);
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </Button>
        }
      />

      <SheetContent
        side="left"
        className="flex w-72 flex-col p-0"
      >
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle>
            <Link
              href="/dashboard"
              onClick={closeSidebar}
              className="flex items-center gap-2 rounded-lg outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="size-5" />
              </span>

              <span className="text-left">
                <span className="block font-semibold">
                  SellerOS AI
                </span>

                <span className="block text-xs font-normal text-muted-foreground">
                  Etsy Growth Assistant
                </span>
              </span>
            </Link>
          </SheetTitle>
        </SheetHeader>

        <nav
          className="flex-1 overflow-y-auto p-3"
          aria-label="Mobile navigation"
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
                  onClick={closeSidebar}
                  aria-current={
                    isActive ? "page" : undefined
                  }
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
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
            <Settings className="size-4 shrink-0" />
            <span>Settings</span>

            <span className="ml-auto text-[10px]">
              Soon
            </span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}