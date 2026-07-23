"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Sparkles,
} from "lucide-react";

import {
  isNavigationRouteActive,
  navigationItems,
} from "@/components/layout/navigation";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function MobileSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

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
            className="shrink-0 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </Button>
        }
      />

      <SheetContent
        side="left"
        className="flex w-[min(18rem,calc(100vw-1rem))] min-w-0 flex-col overflow-hidden p-0"
      >
        <SheetHeader className="shrink-0 border-b px-4 py-4 sm:px-5">
          <SheetTitle className="min-w-0">
            <Link
              href="/dashboard"
              onClick={closeSidebar}
              className="flex min-w-0 items-center gap-2 rounded-lg outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="size-5" />
              </span>

              <span className="min-w-0 text-left">
                <span className="block truncate font-semibold">
                  SellerOS AI
                </span>

                <span className="block truncate text-xs font-normal text-muted-foreground">
                  Etsy Growth Assistant
                </span>
              </span>
            </Link>
          </SheetTitle>
        </SheetHeader>

        <nav
          className="min-w-0 flex-1 overflow-y-auto overscroll-contain p-3"
          aria-label="Mobile navigation"
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
                  onClick={closeSidebar}
                  aria-current={
                    isActive ? "page" : undefined
                  }
                  className={`flex min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
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
      </SheetContent>
    </Sheet>
  );
}