"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Sparkles,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

import {
  isNavigationGroupActive,
  isNavigationRouteActive,
  navigationItems,
} from "@/components/layout/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const [openGroups, setOpenGroups] =
    useState<Record<string, boolean>>({});

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpenGroups((currentGroups) => {
      const nextGroups = {
        ...currentGroups,
      };

      for (const item of navigationItems) {
        if (
          item.type === "group" &&
          isNavigationGroupActive(
            pathname,
            item,
          )
        ) {
          nextGroups[item.name] = true;
        }
      }

      return nextGroups;
    });
  }, [pathname]);

  function toggleGroup(
    groupName: string,
  ) {
    setOpenGroups((currentGroups) => ({
      ...currentGroups,
      [groupName]:
        !currentGroups[groupName],
    }));
  }

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

            if (item.type === "group") {
              const isGroupActive =
                isNavigationGroupActive(
                  pathname,
                  item,
                );

              const isExpanded =
                openGroups[item.name] ??
                isGroupActive;

              return (
                <div
                  key={item.name}
                  className="min-w-0"
                >
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() =>
                      toggleGroup(item.name)
                    }
                    className={`flex min-w-0 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isGroupActive
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-4 shrink-0" />

                    <span className="min-w-0 flex-1 truncate text-left">
                      {item.name}
                    </span>

                    <ChevronDown
                      className={`size-4 shrink-0 transition-transform ${
                        isExpanded
                          ? "rotate-180"
                          : ""
                      }`}
                    />
                  </button>

                  {isExpanded ? (
                    <div className="mt-1 space-y-1 pl-4">
                      {item.children.map(
                        (child) => {
                          const ChildIcon =
                            child.icon;

                          const isActive =
                            isNavigationRouteActive(
                              pathname,
                              child.href,
                            );

                          return (
                            <Link
                              key={
                                child.name
                              }
                              href={
                                child.href
                              }
                              aria-current={
                                isActive
                                  ? "page"
                                  : undefined
                              }
                              className={`flex min-w-0 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                isActive
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                              }`}
                            >
                              <ChildIcon className="size-4 shrink-0" />

                              <span className="min-w-0 truncate">
                                {child.name}
                              </span>
                            </Link>
                          );
                        },
                      )}
                    </div>
                  ) : null}
                </div>
              );
            }

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