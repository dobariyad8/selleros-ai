"use client";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  ChevronDown,
  CreditCard,
  Search,
  Settings,
  Store,
  TriangleAlert,
  Unplug,
  X,
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

function getShopInitials(shopName: string) {
  const words = shopName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "ES";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export default function Header() {
  const router = useRouter();

  const [isMobileSearchOpen, setIsMobileSearchOpen] =
    useState(false);

  const [
    isDisconnectDialogOpen,
    setIsDisconnectDialogOpen,
  ] = useState(false);

  const [
    dismissedNotificationIds,
    setDismissedNotificationIds,
  ] = useState<string[]>([]);

  const {
    analyzedListings,
    shop,
    searchQuery,
    setSearchQuery,
  } = useListings();

  const shopName =
    shop?.shopName?.trim() || "Etsy Shop";

  const shopInitials = getShopInitials(shopName);

  const accountStatus = shop
    ? "Connected Etsy shop"
    : "No shop connected";

  const urgentNotifications = useMemo(
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
        ),
    [analyzedListings],
  );

  const visibleNotifications = useMemo(
    () =>
      urgentNotifications.filter(
        ({ listing }) =>
          !dismissedNotificationIds.includes(
            String(listing.id),
          ),
      ),
    [
      urgentNotifications,
      dismissedNotificationIds,
    ],
  );

  const notifications =
    visibleNotifications.slice(0, 5);

  const notificationCount =
    visibleNotifications.length;

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

  function dismissNotification(
    listingId: string,
  ) {
    setDismissedNotificationIds(
      (currentIds) =>
        currentIds.includes(listingId)
          ? currentIds
          : [...currentIds, listingId],
    );
  }

  function markAllNotificationsRead() {
    setDismissedNotificationIds(
      urgentNotifications.map(
        ({ listing }) =>
          String(listing.id),
      ),
    );
  }

  function openNotification(
    listingId: string,
  ) {
    dismissNotification(listingId);

    router.push(`/audit/${listingId}`);
  }

  function disconnectEtsyShop() {
    setIsDisconnectDialogOpen(false);

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
          className="relative hidden w-full min-w-0 max-w-sm md:block"
          role="search"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            type="search"
            aria-label="Search Etsy listings"
            placeholder="Search listings..."
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
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
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">
                      Notifications
                    </p>

                    <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                      {notificationCount > 0
                        ? `${notificationCount} listings need attention`
                        : "You are all caught up"}
                    </p>
                  </div>
                      
                  {notificationCount > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 shrink-0 px-2 text-xs"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        markAllNotificationsRead();
                      }}
                    >
                      <CheckCheck className="size-3.5" />
                      Mark all read
                    </Button>
                  )}
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
                
            <DropdownMenuSeparator />
                
            <DropdownMenuGroup>
              {notifications.length > 0 ? (
                notifications.map(
                  ({ listing, analysis }) => {
                    const listingId =
                      String(listing.id);
                  
                    return (
                      <DropdownMenuItem
                        key={listingId}
                        className="items-start"
                        onClick={() => {
                          openNotification(listingId);
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
                            {analysis.scores.overall}
                            /100 · Weakest:{" "}
                            {
                              analysis.weakestCategory
                                .category
                            }
                          </p>
                        </div>
                          
                        <button
                          type="button"
                          aria-label="Dismiss notification"
                          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                          
                            dismissNotification(
                              listingId,
                            );
                          }}
                        >
                          <X className="size-3.5" />
                        </button>
                      </DropdownMenuItem>
                    );
                  },
                )
              ) : (
                <DropdownMenuItem disabled>
                  <div className="py-2">
                    <p className="font-medium">
                      No unread notifications
                    </p>
              
                    <p className="mt-1 text-xs font-normal text-muted-foreground">
                      Reviewed notifications are hidden until
                      the page is refreshed.
                    </p>
                  </div>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            
            {urgentNotifications.length > 0 && (
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
                aria-label="Open account menu"
                className="h-10 min-w-0 gap-1 px-1.5 sm:gap-2 sm:px-2"
              />
            }
          >
            <Avatar className="size-8 shrink-0">
              <AvatarFallback className="text-xs font-semibold">
                {shopInitials}
              </AvatarFallback>
            </Avatar>

            <div className="hidden min-w-0 max-w-44 text-left md:block">
              <p className="truncate text-sm font-medium leading-none">
                {shopName}
              </p>

              <p className="mt-1 truncate text-xs text-muted-foreground">
                {accountStatus}
              </p>
            </div>

            <ChevronDown className="hidden size-4 shrink-0 text-muted-foreground sm:block" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-64 max-w-[calc(100vw-1rem)]"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="size-9 shrink-0">
                    <AvatarFallback className="text-xs font-semibold">
                      {shopInitials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {shopName}
                    </p>

                    <p className="mt-0.5 truncate text-xs font-normal text-muted-foreground">
                      {accountStatus}
                    </p>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
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
                onClick={() => {
                  window.setTimeout(() => {
                    setIsDisconnectDialogOpen(true);
                  }, 0);
                }}
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
        <AlertDialog
          open={isDisconnectDialogOpen}
          onOpenChange={setIsDisconnectDialogOpen}
        >
          <AlertDialogContent className="max-w-[calc(100vw-2rem)]">
            <AlertDialogHeader>
              <AlertDialogMedia className="bg-red-50 text-red-600">
                <AlertTriangle className="size-8" />
              </AlertDialogMedia>

              <AlertDialogTitle>
                Disconnect Etsy shop?
              </AlertDialogTitle>

              <AlertDialogDescription>
                SellerOS will remove the Etsy access and refresh
                tokens stored in this browser. Your Etsy shop
                and listings will not be deleted from Etsy.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">
                Connected shop
              </p>

              <p className="mt-1 wrap-break-words font-semibold">
                {shopName}
              </p>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>
                Keep Connected
              </AlertDialogCancel>

              <AlertDialogAction
                variant="destructive"
                onClick={disconnectEtsyShop}
              >
                <Unplug className="size-4" />
                Disconnect Shop
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      
    </header>
  );
}