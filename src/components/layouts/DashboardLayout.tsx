import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { LucideIcon, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

interface DashboardLayoutProps {
  title: string;
  navItems: NavItem[];
  basePath: string;
}

export default function DashboardLayout({ title, navItems, basePath }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const isActive = (path: string) => {
    if (path === basePath) return location.pathname === basePath;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full z-40 glass-panel rounded-none border-y-0 border-l-0 transition-all duration-300 flex flex-col ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        <div className="h-16 flex items-center px-4 border-b border-border gap-2">
          <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          {!collapsed && <span className="font-display font-bold text-foreground truncate">{title}</span>}
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive(item.path)
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-2 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-muted transition-colors w-full"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={`flex-1 transition-all duration-300 ${collapsed ? "ml-16" : "ml-60"}`}>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
