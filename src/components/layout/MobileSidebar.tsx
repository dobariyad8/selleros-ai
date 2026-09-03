"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Menu,
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

  const [isOpen, setIsOpen] =
    useState(false);

  const [
    openGroups,
    setOpenGroups,
  ] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpenGroups(
      (currentGroups) => {
        const nextGroups = {
          ...currentGroups,
        };

        for (
          const item of
            navigationItems
        ) {
          if (
            item.type ===
              "group" &&
            isNavigationGroupActive(
              pathname,
              item,
            )
          ) {
            nextGroups[
              item.name
            ] = true;
          }
        }

        return nextGroups;
      },
    );
  }, [pathname]);

  function closeSidebar() {
    setIsOpen(false);
  }

  function toggleGroup(
    groupName: string,
  ) {
    setOpenGroups(
      (currentGroups) => ({
        ...currentGroups,
        [groupName]:
          !currentGroups[
            groupName
          ],
      }),
    );
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
              onClick={
                closeSidebar
              }
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
            {navigationItems.map(
              (item) => {
                const Icon =
                  item.icon;

                if (
                  item.type ===
                  "group"
                ) {
                  const isGroupActive =
                    isNavigationGroupActive(
                      pathname,
                      item,
                    );

                  const isExpanded =
                    openGroups[
                      item.name
                    ] ??
                    isGroupActive;

                  return (
                    <div
                      key={
                        item.name
                      }
                      className="min-w-0"
                    >
                      <button
                        type="button"
                        aria-expanded={
                          isExpanded
                        }
                        onClick={() =>
                          toggleGroup(
                            item.name,
                          )
                        }
                        className={`flex min-w-0 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                          isGroupActive
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <Icon className="size-4 shrink-0" />

                        <span className="min-w-0 flex-1 truncate text-left">
                          {
                            item.name
                          }
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
                            (
                              child,
                            ) => {
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
                                  onClick={
                                    closeSidebar
                                  }
                                  aria-current={
                                    isActive
                                      ? "page"
                                      : undefined
                                  }
                                  className={`flex min-w-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                    isActive
                                      ? "bg-primary text-primary-foreground"
                                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                  }`}
                                >
                                <ChildIcon className="size-4 shrink-0" />

                                <span className="min-w-0 flex-1 truncate">
                                  {child.name}
                                </span>

                                {child.proOnly ? (
                                  <span
                                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                      isActive
                                        ? "bg-primary-foreground/15 text-primary-foreground"
                                        : "bg-primary/10 text-primary"
                                    }`}
                                  >
                                    Pro
                                  </span>
                                ) : null}
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
                    key={
                      item.name
                    }
                    href={
                      item.href
                    }
                    onClick={
                      closeSidebar
                    }
                    aria-current={
                      isActive
                        ? "page"
                        : undefined
                    }
                    className={`flex min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-4 shrink-0" />

                    <span className="min-w-0 flex-1 truncate">
                      {item.name}
                    </span>
                                      
                    {item.proOnly ? (
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          isActive
                            ? "bg-primary-foreground/15 text-primary-foreground"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        Pro
                      </span>
                    ) : null}
                  </Link>
                );
              },
            )}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}