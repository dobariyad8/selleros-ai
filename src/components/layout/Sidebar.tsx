import {
  BarChart3,
  FileSearch,
  ImageIcon,
  LayoutDashboard,
  ListChecks,
  Settings,
  Sparkles,
  Tags,
  Trophy,
} from "lucide-react";

const navigationItems = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    active: true,
  },
  {
    name: "Listings",
    icon: ListChecks,
    active: false,
  },
  {
    name: "AI Auditor",
    icon: FileSearch,
    active: false,
  },
  {
    name: "Recommendations",
    icon: Sparkles,
    active: false,
  },
  {
    name: "Analytics",
    icon: BarChart3,
    active: false,
  },
  {
    name: "Top Performers",
    icon: Trophy,
    active: false,
  },
  {
    name: "Keywords",
    icon: Tags,
    active: false,
  },
  {
    name: "Images",
    icon: ImageIcon,
    active: false,
  },
];

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-5" />
          </div>

          <div>
            <p className="font-semibold">SellerOS AI</p>
            <p className="text-xs text-muted-foreground">
              Etsy Growth Assistant
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.name}
              type="button"
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                item.active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="size-4" />
              {item.name}
            </button>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Settings className="size-4" />
          Settings
        </button>
      </div>
    </aside>
  );
}