import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { GlobalAreaSwitcher } from "@/components/GlobalAreaSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Home, Ticket, Shield, Calendar, FileText, DollarSign, LogOut, Menu,
} from "lucide-react";
import { useState } from "react";

const sidebarItems = [
  { label: "Painel", path: "/interno", icon: Home },
  { label: "Chamados", path: "/interno/chamados", icon: Ticket },
  { label: "Garantia", path: "/interno/garantia", icon: Shield },
  { label: "Agenda", path: "/interno/agenda", icon: Calendar },
  { label: "Documentos", path: "/interno/documentos", icon: FileText },
  { label: "Financeiro", path: "/interno/financeiro", icon: DollarSign },
];

export default function InternalLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path: string) => {
    if (path === "/interno") return location.pathname === "/interno";
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <GlobalAreaSwitcher />

      <div className="flex flex-1 pt-11">
        {/* Left Sidebar */}
        <aside
          className={cn(
            "hidden md:flex fixed left-0 top-11 h-[calc(100vh-2.75rem)] z-40 flex-col border-r border-border bg-card/60 backdrop-blur-xl transition-all duration-300",
            collapsed ? "w-16" : "w-56"
          )}
        >
          <div className="h-12 flex items-center px-3 border-b border-border">
            <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <Menu className="h-4 w-4 text-foreground" />
            </button>
            {!collapsed && <span className="ml-2 font-display text-sm font-bold text-foreground truncate">Painel Interno</span>}
          </div>

          <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
            {sidebarItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all",
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground shadow-sm font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            ))}
          </nav>

          <div className="p-2 border-t border-border">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-muted transition-colors w-full"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Sair</span>}
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className={cn("flex-1 transition-all duration-300", collapsed ? "md:ml-16" : "md:ml-56")}>
          <div className="p-4 lg:p-8 max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
