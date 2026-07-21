"use client";

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
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Listings", href: "/listings", icon: ListChecks },
  { name: "AI Auditor", href: "/ai-auditor", icon: FileSearch },
  {
    name: "Recommendations",
    href: "/recommendations",
    icon: Sparkles,
  },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  {
    name: "Top Performers",
    href: "/top-performers",
    icon: Trophy,
  },
  { name: "Keywords", href: "/keywords", icon: Tags },
  { name: "Images", href: "/images", icon: ImageIcon },
];

export default function MobileSidebar() {
  const pathname = usePathname();

  return (
    <Sheet>
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

      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="size-5" />
            </span>

            SellerOS AI
          </SheetTitle>
        </SheetHeader>

        <nav className="space-y-1 p-3">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t p-3">
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Settings className="size-4" />
            Settings
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}