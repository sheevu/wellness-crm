import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Users, Sparkles, GitBranch, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useAuth } from "@/hooks/use-auth.ts";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/funnel", label: "Funnel", icon: GitBranch },
  { to: "/tasks", label: "Follow-ups", icon: ListChecks },
  { to: "/services", label: "Services", icon: Sparkles },
];

function NavItem({
  to,
  label,
  icon: Icon,
  onClick,
}: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
        )
      }
    >
      <Icon className="size-5" />
      {label}
    </NavLink>
  );
}

function BottomNavItem({ to, label, icon: Icon }: (typeof NAV_ITEMS)[number]) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        cn(
          "flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-[11px] font-medium transition-colors",
          isActive ? "text-primary" : "text-muted-foreground",
        )
      }
    >
      <Icon className="size-5" />
      {label}
    </NavLink>
  );
}

export default function AppLayout() {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2 px-6 py-6">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-xl shadow-lg">
            🌿
          </div>
          <div>
            <p className="font-display text-lg font-bold leading-tight">
              PoshanCare
            </p>
            <p className="text-xs text-sidebar-foreground/60">
              Wellness CRM
            </p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-4">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>
        <div className="border-t border-sidebar-border px-4 py-4">
          <Authenticated>
            <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent px-3 py-2">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {(user?.profile.name ?? "U").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {user?.profile.name ?? "Owner"}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/60">
                  {user?.profile.email ?? ""}
                </p>
              </div>
            </div>
            <SignInButton
              variant="secondary"
              className="mt-3 w-full"
              signOutText="Sign Out"
            />
          </Authenticated>
          <Unauthenticated>
            <SignInButton className="w-full" />
          </Unauthenticated>
          <AuthLoading>
            <Skeleton className="h-10 w-full" />
          </AuthLoading>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-lg shadow">
              🌿
            </div>
            <p className="font-display text-lg font-bold">PoshanCare</p>
          </div>
          <Authenticated>
            <SignInButton
              variant="secondary"
              size="sm"
              showIcon={false}
              signOutText="Sign Out"
            />
          </Authenticated>
          <Unauthenticated>
            <SignInButton size="sm" />
          </Unauthenticated>
        </header>

        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card/95 px-1 py-1 backdrop-blur-sm md:hidden">
          {NAV_ITEMS.map((item) => (
            <BottomNavItem key={item.to} {...item} />
          ))}
        </nav>
      </div>
    </div>
  );
}
