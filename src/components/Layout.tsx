import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  MapPin,
  PlusCircle,
  Bell,
  FileBarChart,
  Settings,
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

export default function Layout() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex w-64 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="px-6 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">
              VR
            </div>
            <div>
              <div className="font-bold text-sidebar-foreground leading-tight">ValeRepor</div>
              <div className="text-xs text-muted-foreground">Controle de validade</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60"
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 text-xs text-muted-foreground border-t border-sidebar-border">
          v1.1 · Modo offline
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 h-14 border-b bg-card">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              VR
            </div>
            <span className="font-semibold">ValeRepor</span>
          </div>
        </header>

        <main className="flex-1 pb-20 md:pb-0 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-4 md:p-8">
            <Outlet />
          </div>
        </main>

        {/* Bottom nav (mobile) */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-card border-t border-border z-40">
          <div className="grid grid-cols-5 h-16">
            {nav
              .filter((n) => !["/produtos", "/locais"].includes(n.to))
              .concat([nav.find((n) => n.to === "/produtos")!])
              .map((item) => {
                const active =
                  item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
                if (item.primary) {
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className="flex flex-col items-center justify-center -mt-6"
                    >
                      <div className="w-14 h-14 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center shadow-elevated">
                        <PlusCircle className="w-7 h-7" />
                      </div>
                      <span className="text-[10px] mt-0.5 text-muted-foreground">Nova</span>
                    </NavLink>
                  );
                }
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 text-xs",
                      active ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-[10px]">{item.label.split(" ")[0]}</span>
                  </NavLink>
                );
              })}
          </div>
        </nav>
      </div>
    </div>
  );
}
