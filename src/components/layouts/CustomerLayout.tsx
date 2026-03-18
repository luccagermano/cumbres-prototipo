import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { GlobalAreaSwitcher } from "@/components/GlobalAreaSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Home, Building, DollarSign, FileText, ClipboardCheck,
  Wrench, HelpCircle, Bell, Calendar, Bot, LogOut, Menu,
  MessageCircle,
} from "lucide-react";
import { useState } from "react";

const sidebarItems = [
  { label: "Início", path: "/cliente", icon: Home },
  { label: "Minha Unidade", path: "/cliente/unidade", icon: Building },
  { label: "Financeiro", path: "/cliente/financeiro", icon: DollarSign },
  { label: "Documentos", path: "/cliente/documentos", icon: FileText },
  { label: "Vistoria", path: "/cliente/vistoria", icon: ClipboardCheck },
  { label: "Assistência", path: "/cliente/assistencia", icon: Wrench },
  { label: "Ajuda", path: "/cliente/ajuda", icon: HelpCircle },
  { label: "Notificações", path: "/cliente/notificacoes", icon: Bell },
  { label: "Calendário", path: "/cliente/calendario", icon: Calendar },
  { label: "Assistente", path: "/cliente/assistente", icon: Bot },
];

const mobileNav = [
  { label: "Início", path: "/cliente", icon: Home },
  { label: "Financeiro", path: "/cliente/financeiro", icon: DollarSign },
  { label: "Serviços", path: "/cliente/assistencia", icon: Wrench },
  { label: "Assistente", path: "/cliente/assistente", icon: Bot },
  { label: "Avisos", path: "/cliente/notificacoes", icon: Bell },
];

export default function CustomerLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path: string) => {
    if (path === "/cliente") return location.pathname === "/cliente";
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <GlobalAreaSwitcher />

      <div className="flex flex-1 pt-11">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "hidden lg:flex fixed left-0 top-11 h-[calc(100vh-2.75rem)] z-40 flex-col border-r border-border/60 bg-card/90 backdrop-blur-xl transition-all duration-300",
            collapsed ? "w-[3.5rem]" : "w-52"
          )}
        >
          <div className="h-11 flex items-center px-2.5 border-b border-border/50">
            <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <Menu className="h-4 w-4 text-muted-foreground" />
            </button>
            {!collapsed && <span className="ml-2 font-display text-[13px] font-semibold text-foreground truncate">Portal do Cliente</span>}
          </div>

          <nav className="flex-1 py-2 px-1.5 space-y-0.5 overflow-y-auto">
            {sidebarItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] transition-all duration-150",
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground shadow-sm font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <item.icon className="h-[15px] w-[15px] shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            ))}
          </nav>

          <div className="p-1.5 border-t border-border/50">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] text-muted-foreground hover:text-destructive hover:bg-muted/60 transition-colors w-full"
            >
              <LogOut className="h-[15px] w-[15px] shrink-0" />
              {!collapsed && <span>Sair</span>}
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className={cn(
          "flex-1 transition-all duration-300 pb-20 lg:pb-0",
          collapsed ? "lg:ml-[3.5rem]" : "lg:ml-52"
        )}>
          <div className="px-4 py-4 sm:px-6 lg:px-8 lg:py-6 max-w-6xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-card/95 backdrop-blur-xl safe-area-inset-bottom">
        <div className="flex items-center justify-around h-14 px-1">
          {mobileNav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors min-w-0",
                isActive(item.path)
                  ? "text-primary"
                  : "text-muted-foreground/70"
              )}
            >
              <item.icon className={cn("h-[18px] w-[18px]", isActive(item.path) && "stroke-[2.5]")} />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* WhatsApp floating button (mobile) */}
      <a
        href="https://wa.me/"
        target="_blank"
        rel="noopener noreferrer"
        className="lg:hidden fixed bottom-[4.5rem] right-3 z-50 p-3 rounded-full bg-[hsl(142_70%_45%)] text-white shadow-lg hover:shadow-xl transition-all active:scale-95"
      >
        <MessageCircle className="h-5 w-5" />
      </a>
    </div>
  );
}
