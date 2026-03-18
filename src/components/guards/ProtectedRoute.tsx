import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

type Props = {
  /** If provided, user must have at least one of these roles */
  allowedRoles?: string[];
};

function devLog(label: string, data: unknown) {
  if (import.meta.env.DEV) {
    console.log(`[ProtectedRoute] ${label}:`, data);
  }
}

export default function ProtectedRoute({ allowedRoles }: Props) {
  const { session, memberships, loading, isPlatformAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    devLog("denied", { reason: "no_session", pathname: location.pathname });
    return <Navigate to="/login" replace />;
  }

  // Platform admins bypass all role checks
  if (isPlatformAdmin) {
    devLog("allowed", { reason: "platform_admin", pathname: location.pathname });
    return <Outlet />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasAccess = memberships.some(
      (m) => m.active && allowedRoles.includes(m.role)
    );
    if (!hasAccess) {
      devLog("denied", { reason: "missing_role", required: allowedRoles, has: memberships.map(m => m.role), pathname: location.pathname });
      return <Navigate to="/cliente" replace />;
    }
  }

  return <Outlet />;
}
