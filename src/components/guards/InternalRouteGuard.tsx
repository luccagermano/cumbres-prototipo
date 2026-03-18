import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessPath } from "@/lib/internal-permissions";
import { ShieldOff } from "lucide-react";

/**
 * Guards individual internal routes based on the role access matrix.
 * Wraps around route groups or individual routes inside the /interno layout.
 * If access is denied, redirects to /interno with a clean fallback.
 */
export default function InternalRouteGuard() {
  const { memberships, isPlatformAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!canAccessPath(memberships, isPlatformAdmin, location.pathname)) {
    // For the dashboard itself, show an inline message instead of redirect loop
    if (location.pathname === "/interno") {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="p-4 rounded-2xl bg-muted/50 mb-4">
            <ShieldOff className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="font-display text-lg font-semibold text-foreground mb-1">
            Acesso restrito
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Seu perfil não possui permissão para acessar este módulo. Entre em contato com o administrador da organização.
          </p>
        </div>
      );
    }
    return <Navigate to="/interno" replace />;
  }

  return <Outlet />;
}
