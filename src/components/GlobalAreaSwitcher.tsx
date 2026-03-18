import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Globe, Layers, Users, Wrench, BarChart3, BookOpen, Building2,
} from "lucide-react";

const areas = [
  { label: "Site", path: "/site", icon: Globe },
  { label: "Empreendimentos", path: "/empreendimentos", icon: Layers },
  { label: "Portal do Cliente", path: "/cliente", icon: Users },
  { label: "Painel Interno", path: "/interno", icon: Wrench },
  { label: "Executivo", path: "/executivo", icon: BarChart3 },
  { label: "Documentação", path: "/documentacao", icon: BookOpen },
];

export function GlobalAreaSwitcher() {
  const location = useLocation();

  const getActive = () => {
    for (const area of areas) {
      if (location.pathname.startsWith(area.path)) return area.path;
    }
    return null;
  };

  const active = getActive();

  return (
    <header className="fixed top-0 left-0 right-0 z-[60] h-11 border-b border-border/60 bg-card/80 backdrop-blur-xl">
      <div className="h-full flex items-center px-4 gap-1">
        <Link to="/site" className="flex items-center gap-1.5 mr-4 shrink-0">
          <Building2 className="h-5 w-5 text-primary" />
          <span className="font-display text-sm font-bold text-foreground hidden sm:inline">Construtora</span>
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

        <div className="ml-auto">
          <Link
            to="/login"
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            Entrar
          </Link>
        </div>
      </div>
    </header>
  );
}
