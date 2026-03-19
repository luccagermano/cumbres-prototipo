import { Outlet, useLocation } from "react-router-dom";
import { GlobalAreaSwitcher } from "@/components/GlobalAreaSwitcher";

export default function PublicLayout() {
  const location = useLocation();
  const isSiteHome = location.pathname === "/site";

  // SiteHome has its own header/footer so we render it without the global chrome
  if (isSiteHome) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <GlobalAreaSwitcher />
      <main className="flex-1 pt-11">
        <Outlet />
      </main>
      <footer className="border-t border-border py-8 bg-card/40">
        <div className="container text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Construtora. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
