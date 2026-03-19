import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { cn } from "@/lib/utils";
import { Building2, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

const navItems = [
  { label: "Início", path: "/site" },
  { label: "Empreendimentos", path: "/empreendimentos" },
  { label: "Sobre", path: "/site/sobre" },
  { label: "Contato", path: "/site/contato" },
];

export default function PublicLayout() {
  const { pathname } = useLocation();
  const { session } = useAuth();
  const { org, logoUrl, orgInitials } = useOrg();
  const brandName = org?.name ?? "Construtora";
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  const isHome = pathname === "/site";

  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── HEADER ─── */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled || !isHome
            ? "bg-white/90 backdrop-blur-xl border-b border-border/40 shadow-sm"
            : "bg-transparent"
        )}
      >
        <div className="container max-w-6xl flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/site" className="flex items-center gap-2.5 shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={brandName} className="h-7 max-w-[7rem] object-contain" />
            ) : orgInitials ? (
              <div className="h-8 w-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
                <span className="text-xs font-bold text-brand-500">{orgInitials}</span>
              </div>
            ) : (
              <Building2 className={cn("h-6 w-6", scrolled || !isHome ? "text-brand-500" : "text-white")} />
            )}
            <span
              className={cn(
                "font-display text-base font-bold tracking-tight hidden sm:inline",
                scrolled || !isHome ? "text-foreground" : "text-white"
              )}
            >
              {brandName}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                    active
                      ? scrolled || !isHome
                        ? "text-brand-500"
                        : "text-white"
                      : scrolled || !isHome
                        ? "text-muted-foreground hover:text-foreground"
                        : "text-white/70 hover:text-white"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {session ? (
              <Link
                to="/cliente"
                className={cn(
                  "hidden md:inline-flex px-5 py-2 rounded-full text-sm font-semibold transition-colors",
                  scrolled || !isHome
                    ? "bg-brand-500 text-white hover:bg-brand-600"
                    : "bg-white text-brand-600 hover:bg-brand-50"
                )}
              >
                Meu Portal
              </Link>
            ) : (
              <Link
                to="/login"
                className={cn(
                  "hidden md:inline-flex px-5 py-2 rounded-full text-sm font-semibold transition-colors",
                  scrolled || !isHome
                    ? "bg-brand-500 text-white hover:bg-brand-600"
                    : "bg-white/15 text-white hover:bg-white/25 border border-white/20"
                )}
              >
                Entrar
              </Link>
            )}

            {/* Mobile toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={cn(
                "md:hidden p-2 rounded-lg transition-colors ml-2",
                scrolled || !isHome ? "text-foreground" : "text-white"
              )}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-border/40 shadow-lg">
            <nav className="container py-4 flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                    pathname === item.path
                      ? "bg-brand-50 text-brand-600"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-border/40 mt-2 pt-3">
                <Link
                  to={session ? "/cliente" : "/login"}
                  className="block px-4 py-3 rounded-xl text-sm font-semibold bg-brand-500 text-white text-center"
                >
                  {session ? "Meu Portal" : "Entrar"}
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ─── CONTENT ─── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="bg-brand-600 text-white">
        <div className="container max-w-6xl py-16 lg:py-20">
          <div className="grid md:grid-cols-3 gap-12 lg:gap-16">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-5">
                {logoUrl ? (
                  <img src={logoUrl} alt={brandName} className="h-7 max-w-[7rem] object-contain brightness-0 invert" />
                ) : (
                  <Building2 className="h-6 w-6 text-white/80" />
                )}
                <span className="font-display text-base font-bold">{brandName}</span>
              </div>
              <p className="text-white/60 text-sm leading-relaxed max-w-xs">
                Empreendimentos desenvolvidos com rigor construtivo, identidade arquitetônica e compromisso com a qualidade.
              </p>
            </div>

            {/* Navigation */}
            <div>
              <h4 className="font-display text-sm font-semibold mb-5 text-white/90">Navegação</h4>
              <ul className="space-y-3">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <Link to={item.path} className="text-sm text-white/60 hover:text-white transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link to="/empreendimentos" className="text-sm text-white/60 hover:text-white transition-colors">
                    Empreendimentos
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-display text-sm font-semibold mb-5 text-white/90">Contato</h4>
              <ul className="space-y-3 text-sm text-white/60">
                <li>contato@construtora.com.br</li>
                <li>(51) 3000-0000</li>
                <li>Av. Exemplo, 1000 — Porto Alegre, RS</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/15 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/40">
              © {new Date().getFullYear()} {brandName}. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6 text-xs text-white/40">
              <span className="hover:text-white/70 transition-colors cursor-pointer">Política de Privacidade</span>
              <span className="hover:text-white/70 transition-colors cursor-pointer">Termos de Uso</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
