"use client";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  CreditCard,
  Search,
  Settings,
  Store,
  TriangleAlert,
  Unplug,
} from "lucide-react";

import { useListings } from "@/hooks/useListings";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import MobileSidebar from "./MobileSidebar";

export default function Header() {
  const router = useRouter();

  const [isMobileSearchOpen, setIsMobileSearchOpen] =
    useState(false);

  const {
  analyzedListings,
  shop,
  searchQuery,
  setSearchQuery,
} = useListings();

  const notifications = useMemo(
    () =>
      [...analyzedListings]
        .filter(
          ({ analysis }) =>
            analysis.scores.overall < 70,
        )
        .sort(
          (first, second) =>
            first.analysis.scores.overall -
            second.analysis.scores.overall,
        )
        .slice(0, 5),
    [analyzedListings],
  );

  const notificationCount =
    analyzedListings.filter(
      ({ analysis }) =>
        analysis.scores.overall < 70,
    ).length;

  function openListingSearch() {
    setIsMobileSearchOpen(false);
    router.push("/listings");
  }

  function handleDesktopSearchSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    router.push("/listings");
  }

  function handleMobileSearchSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    openListingSearch();
  }

  function disconnectEtsyShop() {
    const form = document.createElement("form");

    form.method = "POST";
    form.action = "/api/auth/etsy/disconnect";
    form.style.display = "none";

    document.body.appendChild(form);
    form.submit();
  }

  return (
    <header className="flex h-16 min-w-0 shrink-0 items-center justify-between border-b bg-background px-3 sm:px-4 lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <MobileSidebar />

        <form
          onSubmit={handleDesktopSearchSubmit}
          className="relative hidden min-w-0 w-full max-w-sm md:block"
          role="search"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            type="search"
            aria-label="Search Etsy listings"
            placeholder="Search listings..."
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(
                event.target.value,
              );
            }}
            className="w-full pl-9 pr-16"
          />

          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 h-7 -translate-y-1/2 px-2 text-xs"
          >
            Search
          </Button>
        </form>
      </div>

      <div className="ml-2 flex shrink-0 items-center gap-1 sm:gap-2">
        <Sheet
          open={isMobileSearchOpen}
          onOpenChange={setIsMobileSearchOpen}
        >
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 md:hidden"
                aria-label="Search listings"
              >
                <Search className="size-5" />
              </Button>
            }
          />

          <SheetContent
            side="top"
            className="min-w-0 p-0"
          >
            <SheetHeader className="border-b px-4 py-4">
              <SheetTitle>
                Search Etsy Listings
              </SheetTitle>
            </SheetHeader>

            <form
              onSubmit={handleMobileSearchSubmit}
              className="min-w-0 p-4"
              role="search"
            >
              <div className="relative min-w-0">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  type="search"
                  autoFocus
                  aria-label="Search Etsy listings"
                  placeholder="Search titles, tags, or listing IDs..."
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(
                      event.target.value,
                    );
                  }}
                  className="w-full pl-9"
                />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                  }}
                  disabled={searchQuery.length === 0}
                >
                  Clear
                </Button>

                <Button type="submit">
                  Search
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Notifications${
                  notificationCount > 0
                    ? `, ${notificationCount} listings need attention`
                    : ""
                }`}
                className="relative shrink-0"
              />
            }
          >
            <Bell className="size-5" />

            {notificationCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-destructive-foreground">
                {notificationCount > 9
                  ? "9+"
                  : notificationCount}
              </span>
            )}
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-80 max-w-[calc(100vw-1rem)]"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                Notifications
              </DropdownMenuLabel>

              {notifications.length > 0 ? (
                notifications.map(
                  ({ listing, analysis }) => (
                    <DropdownMenuItem
                      key={listing.id}
                      className="items-start"
                      onClick={() => {
                        router.push(
                          `/audit/${listing.id}`,
                        );
                      }}
                    >
                      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 wrap-break-words">
                          {listing.title?.trim() ||
                            "Untitled listing"}
                        </p>

                        <p className="mt-1 text-xs font-normal text-muted-foreground">
                          Score:{" "}
                          {
                            analysis.scores
                              .overall
                          }
                          /100 · Weakest:{" "}
                          {
                            analysis
                              .weakestCategory
                              .category
                          }
                        </p>
                      </div>
                    </DropdownMenuItem>
                  ),
                )
              ) : (
                <DropdownMenuItem disabled>
                  <div className="py-2">
                    <p className="font-medium">
                      No urgent issues
                    </p>

                    <p className="mt-1 text-xs font-normal text-muted-foreground">
                      No listings currently score
                      below 70.
                    </p>
                  </div>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>

            {notificationCount > 0 && (
              <>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => {
                      router.push(
                        "/recommendations",
                      );
                    }}
                  >
                    View all recommendations
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="h-10 min-w-0 gap-1 px-1.5 sm:gap-2 sm:px-2"
              />
            }
          >
            <Avatar className="size-8 shrink-0">
              <AvatarFallback>
                DD
              </AvatarFallback>
            </Avatar>

            <div className="hidden min-w-0 text-left md:block">
              <p className="truncate text-sm font-medium leading-none">
                Dhruv
              </p>

              <p className="mt-1 truncate text-xs text-muted-foreground">
                {shop?.shopName ?? "Etsy shop"}
              </p>
            </div>

            <ChevronDown className="hidden size-4 shrink-0 text-muted-foreground sm:block" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-56 max-w-[calc(100vw-1rem)]"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                My account
              </DropdownMenuLabel>
                    
              <DropdownMenuItem
                onClick={() => {
                  router.push("/shop-profile");
                }}
              >
                <Store className="size-4" />
                Shop profile
              </DropdownMenuItem>
              
              <DropdownMenuItem
                onClick={() => {
                  router.push("/subscription");
                }}
              >
                <CreditCard className="size-4" />
                Subscription
              </DropdownMenuItem>
              
              <DropdownMenuItem
                onClick={() => {
                  router.push("/settings");
                }}
              >
                <Settings className="size-4" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
              
            <DropdownMenuSeparator />
              
            <DropdownMenuGroup>
              <DropdownMenuItem
                variant="destructive"
                disabled={!shop}
                onClick={disconnectEtsyShop}
              >
                <Unplug className="size-4" />
              
                {shop
                  ? "Disconnect Etsy Shop"
                  : "No Etsy Shop Connected"}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}