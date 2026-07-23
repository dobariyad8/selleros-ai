import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { ListingsProvider } from "@/providers/ListingsProvider";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <ListingsProvider>
      <div className="flex min-h-screen min-w-0 bg-background">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header />

          <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-muted/30 px-0 py-4 sm:px-6 sm:py-6">
            {children}
          </main>
        </div>
      </div>
    </ListingsProvider>
  );
}