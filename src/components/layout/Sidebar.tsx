"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

import {
  isNavigationRouteActive,
  navigationItems,
} from "@/components/layout/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-64 min-w-0 shrink-0 flex-col overflow-hidden border-r bg-card lg:flex">
      <div className="flex h-16 min-w-0 shrink-0 items-center border-b px-5 xl:px-6">
        <Link
          href="/dashboard"
          className="flex min-w-0 items-center gap-2 rounded-lg outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-5" />
          </div>

          <div className="min-w-0">
            <p className="truncate font-semibold">
              SellerOS AI
            </p>

            <p className="truncate text-xs text-muted-foreground">
              Etsy Growth Assistant
            </p>
          </div>
        </Link>
      </div>

      <nav
        className="min-w-0 flex-1 overflow-y-auto overscroll-contain p-3"
        aria-label="Main navigation"
      >
        <div className="min-w-0 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              isNavigationRouteActive(
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
                className={`flex min-w-0 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="size-4 shrink-0" />

                <span className="min-w-0 truncate">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}