import { Outlet } from "react-router-dom";
import { GlobalAreaSwitcher } from "@/components/GlobalAreaSwitcher";

export default function PublicLayout() {
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
