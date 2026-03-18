import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Globe, Layers, Users, Wrench, BarChart3, BookOpen, Building2, LogOut, Shield,
} from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

export function GlobalAreaSwitcher() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, profile, isStaff, isExecutive, hasRole, isPlatformAdmin, memberships } = useAuth();

  // Resolve current org
  const orgIds = [...new Set(memberships.filter(m => m.active).map(m => m.organization_id))];
  const currentOrgId = orgIds[0] ?? null;

  const { data: currentOrg } = useQuery({
    queryKey: ["global-header-org", currentOrgId],
    enabled: !!session && !!currentOrgId,
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

  const { data: orgLogoUrl } = useQuery({
    queryKey: ["global-header-logo", currentOrg?.logo_path],
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
  const areas = useMemo(() => {
    const base = [
      { label: "Site", path: "/site", icon: Globe },
      { label: "Empreendimentos", path: "/empreendimentos", icon: Layers },
    ];

    if (session) {
      base.push({ label: "Portal do Cliente", path: "/cliente", icon: Users });

      if (isPlatformAdmin || isStaff || hasRole("org_admin")) {
        base.push({ label: "Painel Interno", path: "/interno", icon: Wrench });
      }

      if (isPlatformAdmin || isExecutive || hasRole("org_admin")) {
        base.push({ label: "Executivo", path: "/executivo", icon: BarChart3 });
      }
    }

    base.push({ label: "Documentação", path: "/documentacao", icon: BookOpen });
    return base;
  }, [session, isStaff, isExecutive, hasRole, isPlatformAdmin]);

  const getActive = () => {
    for (const area of areas) {
      if (location.pathname.startsWith(area.path)) return area.path;
    }
    return null;
  };

  const active = getActive();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[60] h-11 border-b border-border/60 bg-card/80 backdrop-blur-xl">
      <div className="h-full flex items-center px-4 gap-1">
        <Link to="/site" className="flex items-center gap-1.5 mr-4 shrink-0">
          {orgLogoUrl ? (
            <img src={orgLogoUrl} alt={currentOrg?.name ?? ""} className="h-6 max-w-[6rem] object-contain shrink-0" />
          ) : orgInitials ? (
            <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-primary">{orgInitials}</span>
            </div>
          ) : (
            <Building2 className="h-5 w-5 text-primary" />
          )}
          <span className="font-display text-sm font-bold text-foreground hidden sm:inline truncate max-w-[120px]">
            {currentOrg?.name ?? "Construtora"}
          </span>
        </Link>

        <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
          {areas.map((area) => {
            const isActive = active === area.path;
            return (
              <Link
                key={area.path}
                to={area.path}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <area.icon className="h-3.5 w-3.5" />
                <span className="hidden md:inline">{area.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {session ? (
            <>
              {isPlatformAdmin && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-semibold uppercase tracking-wider">
                  <Shield className="h-3 w-3" />
                  Admin
                </span>
              )}
              <span className="text-xs text-muted-foreground hidden sm:inline truncate max-w-[120px]">
                {profile?.full_name || session.user.email}
              </span>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
