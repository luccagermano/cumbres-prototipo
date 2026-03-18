import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { GlobalAreaSwitcher } from "@/components/GlobalAreaSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  Home, Ticket, Shield, Calendar, FileText, DollarSign, LogOut, Menu, Database,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

const sidebarItems = [
  { label: "Painel", path: "/interno", icon: Home },
  { label: "Cadastros", path: "/interno/cadastros", icon: Database },
  { label: "Chamados", path: "/interno/chamados", icon: Ticket },
  { label: "Garantia", path: "/interno/garantia", icon: Shield },
  { label: "Agenda", path: "/interno/agenda", icon: Calendar },
  { label: "Documentos", path: "/interno/documentos", icon: FileText },
  { label: "Financeiro", path: "/interno/financeiro", icon: DollarSign },
];

export default function InternalLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, memberships } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const orgIds = [...new Set(memberships.filter(m => m.active).map(m => m.organization_id))];
  const currentOrgId = orgIds[0] ?? null;

  const { data: currentOrg } = useQuery({
    queryKey: ["internal-layout-org", currentOrgId],
    enabled: !!user && !!currentOrgId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("organizations")
        .select("id, name, slug, logo_path")
        .eq("id", currentOrgId!)
        .single();
      return data;
    },
  });

  const { data: logoUrl } = useQuery({
    queryKey: ["org-logo-signed", currentOrg?.logo_path],
    enabled: !!currentOrg?.logo_path,
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.storage
        .from("organization-assets-private")
        .createSignedUrl(currentOrg!.logo_path!, 3600);
      return data?.signedUrl ?? null;
    },
  });

  const orgInitials = currentOrg?.name
    ? currentOrg.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
    : null;

  const isActive = (path: string) => {
    if (path === "/interno") return location.pathname === "/interno";
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
        <aside
          className={cn(
            "hidden md:flex fixed left-0 top-11 h-[calc(100vh-2.75rem)] z-40 flex-col border-r border-border/60 bg-card/90 backdrop-blur-xl transition-all duration-300",
            collapsed ? "w-[3.5rem]" : "w-52"
          )}
        >
          <div className="h-11 flex items-center px-2.5 border-b border-border/50 gap-2">
            <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0">
              <Menu className="h-4 w-4 text-muted-foreground" />
            </button>
            {!collapsed && currentOrg && (
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={currentOrg.name}
                    className="h-6 w-6 rounded object-contain shrink-0"
                  />
                ) : orgInitials ? (
                  <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-primary">{orgInitials}</span>
                  </div>
                ) : null}
                <span className="font-display text-[13px] font-semibold text-foreground truncate">
                  {currentOrg.name}
                </span>
              </div>
            )}
            {!collapsed && !currentOrg && (
              <span className="ml-2 font-display text-[13px] font-semibold text-foreground truncate">Painel Interno</span>
            )}
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

        <main className={cn("flex-1 transition-all duration-300", collapsed ? "md:ml-[3.5rem]" : "md:ml-52")}>
          <div className="px-4 py-4 sm:px-6 lg:px-8 lg:py-6 max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
