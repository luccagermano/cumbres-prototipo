import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

type Props = {
  /** If provided, user must have at least one of these roles */
  allowedRoles?: string[];
};

export default function ProtectedRoute({ allowedRoles }: Props) {
  const { session, memberships, loading, isPlatformAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Platform admins bypass all role checks
  if (isPlatformAdmin) {
    return <Outlet />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasAccess = memberships.some(
      (m) => m.active && allowedRoles.includes(m.role)
    );
    if (!hasAccess) {
      return <Navigate to="/cliente" replace />;
    }
  }

  return <Outlet />;
}
