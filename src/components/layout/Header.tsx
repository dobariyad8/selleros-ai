"use client";

import { useMemo, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  Search,
  TriangleAlert,
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

import MobileSidebar from "./MobileSidebar";

export default function Header() {
  const router = useRouter();

  const {
    analyzedListings,
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

  function handleSearchSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    router.push("/listings");
  }

  return (
    <header className="flex h-16 min-w-0 shrink-0 items-center justify-between border-b bg-background px-3 sm:px-4 lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <MobileSidebar />

        <form
          onSubmit={handleSearchSubmit}
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
                Uniquely Crafts
              </p>
            </div>

            <ChevronDown className="hidden size-4 shrink-0 text-muted-foreground sm:block" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-52 max-w-[calc(100vw-1rem)]"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                My account
              </DropdownMenuLabel>

              <DropdownMenuItem>
                Shop profile
              </DropdownMenuItem>

              <DropdownMenuItem>
                Subscription
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  router.push("/settings");
                }}
              >
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}