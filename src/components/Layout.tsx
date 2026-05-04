import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  MapPin,
  PlusCircle,
  Bell,
  FileBarChart,
  Settings,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/alertas", label: "Alertas", icon: Bell },
  { to: "/nova", label: "Nova Reposição", icon: PlusCircle, primary: true },
  { to: "/produtos", label: "Produtos", icon: Package },
  { to: "/locais", label: "Setores", icon: MapPin },
  { to: "/relatorios", label: "Relatórios", icon: FileBarChart },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

const mobileNav = [
  { to: "/", label: "Início", icon: LayoutDashboard, end: true },
  { to: "/alertas", label: "Alertas", icon: Bell },
  { to: "/nova", label: "Nova", icon: PlusCircle, primary: true },
  { to: "/relatorios", label: "Relatórios", icon: FileBarChart },
  { to: "/configuracoes", label: "Ajustes", icon: Settings },
];

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "grid place-items-center rounded-2xl bg-gradient-primary text-primary-foreground font-black shadow-green",
          compact ? "h-10 w-10 text-sm" : "h-12 w-12 text-base"
        )}
      >
        VR
      </div>
      <div className="min-w-0">
        <div className={cn("font-extrabold tracking-tight leading-none", compact ? "text-lg" : "text-xl")}>ValeRepor</div>
        {!compact && <div className="mt-1 text-xs text-muted-foreground">Controle de validade e reposição</div>}
      </div>
    </div>
  );
}

export default function Layout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="flex min-h-screen w-full">
        <aside className="hidden md:flex w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/90 backdrop-blur-xl">
          <div className="px-6 py-6 border-b border-sidebar-border">
            <Logo />
          </div>

          <nav className="flex-1 p-4 space-y-1.5">
            <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Operação</div>
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-green"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )
                }
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 group-hover:bg-white/20">
                  <item.icon className="h-5 w-5" />
                </span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="m-4 rounded-3xl border border-border/70 bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                <WifiOff className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold">Modo offline</div>
                <div className="text-xs text-muted-foreground">v1.2 · PWA local</div>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="md:hidden sticky top-0 z-40 border-b border-border/70 bg-background/88 px-4 py-3 backdrop-blur-xl">
            <div className="mx-auto flex max-w-md items-center justify-between">
              <Logo compact />
              <div className="rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold text-muted-foreground shadow-card">
                Offline
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto pb-32 md:pb-0">
            <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 md:px-8 md:py-8">
              <Outlet />
            </div>
          </main>

          <nav className="md:hidden pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)]">
            <div className="pointer-events-auto relative mx-auto h-[76px] max-w-md rounded-[28px] border border-border/80 bg-card/95 shadow-dock backdrop-blur-xl">
              <div className="grid h-full grid-cols-5 items-center px-1">
                {mobileNav.map((item) => {
                  const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);

                  if (item.primary) {
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className="relative flex h-full flex-col items-center justify-end pb-2 text-xs"
                        aria-label="Nova reposição"
                      >
                        <span
                          className={cn(
                            "absolute -top-7 grid h-16 w-16 place-items-center rounded-[24px] bg-gradient-primary text-primary-foreground shadow-fab ring-8 ring-background transition-transform duration-200",
                            active ? "scale-105" : "active:scale-95"
                          )}
                        >
                          <PlusCircle className="h-8 w-8" />
                        </span>
                        <span className="text-[11px] font-extrabold text-primary">Nova</span>
                      </NavLink>
                    );
                  }

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={cn(
                        "flex h-full flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold transition-all duration-200",
                        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-9 w-9 place-items-center rounded-2xl transition-all duration-200",
                          active ? "bg-primary/10" : "bg-transparent"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                      </span>
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
