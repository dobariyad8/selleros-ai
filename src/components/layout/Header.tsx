import {
  Bell,
  ChevronDown,
  Search,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

import MobileSidebar from "./MobileSidebar";

export default function Header() {
  return (
    <header className="flex h-16 min-w-0 shrink-0 items-center justify-between border-b bg-background px-3 sm:px-4 lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <MobileSidebar />

        <div className="relative hidden min-w-0 w-full max-w-sm md:block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            placeholder="Search listings..."
            className="w-full pl-9"
          />
        </div>
      </div>

      <div className="ml-2 flex shrink-0 items-center gap-1 sm:gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="shrink-0"
        >
          <Bell className="size-5" />
        </Button>

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
            <DropdownMenuLabel>
              My account
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem>
              Shop profile
            </DropdownMenuItem>

            <DropdownMenuItem>
              Subscription
            </DropdownMenuItem>

            <DropdownMenuItem>
              Settings
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}