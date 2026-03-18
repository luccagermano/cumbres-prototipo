import { Outlet, Link, useLocation } from "react-router-dom";
import { Building2, Info, Phone, Home, Layers } from "lucide-react";

const navItems = [
  { label: "Início", path: "/site", icon: Home },
  { label: "Sobre", path: "/site/sobre", icon: Info },
  { label: "Empreendimentos", path: "/empreendimentos", icon: Layers },
  { label: "Contato", path: "/site/contato", icon: Phone },
];

export default function PublicLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 glass-panel rounded-none border-x-0 border-t-0">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/site" className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-display text-lg font-bold text-foreground">Construtora</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            to="/login"
            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Entrar
          </Link>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Construtora. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
