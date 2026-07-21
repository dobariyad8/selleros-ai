import { Bell, ChevronDown, Search } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
     <div className="flex min-w-0 flex-1 items-center gap-2">
        <MobileSidebar />
     
      <div className="relative hidden w-full max-w-sm md:block">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          placeholder="Search listings..."
          className="pl-9"
        />
      </div>
     </div>

      <div className="ml-auto flex items-center gap-2">

        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="size-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger render ={
            <Button
                variant="ghost"
                className="h-10 gap-2 px-2"
            />
            }
            >
              <Avatar className="size-8">
                <AvatarFallback>DD</AvatarFallback>
              </Avatar>

              <div className="hidden text-left md:block">
                <p className="text-sm font-medium leading-none">
                  Dhruv
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Uniquely Crafts
                </p>
              </div>

              <ChevronDown className="size-4 text-muted-foreground" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>My account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Shop profile</DropdownMenuItem>
            <DropdownMenuItem>Subscription</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}