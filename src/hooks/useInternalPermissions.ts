import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import {
  canAccessRoute,
  canWriteModule,
  canManageCadastros,
  getRouteKeyFromPath,
  type RouteKey,
} from "@/lib/internal-permissions";

/**
 * Hook that returns role-aware permission flags for the current internal page.
 * Usage: const { canWrite, isReadOnly } = useInternalPermissions();
 */
export function useInternalPermissions(overrideRouteKey?: RouteKey) {
  const { memberships, isPlatformAdmin } = useAuth();
  const location = useLocation();

  return useMemo(() => {
    const routeKey = overrideRouteKey ?? getRouteKeyFromPath(location.pathname);

    const canView = routeKey
      ? canAccessRoute(memberships, isPlatformAdmin, routeKey)
      : true;

    const canWrite = routeKey
      ? canWriteModule(memberships, isPlatformAdmin, routeKey)
      : isPlatformAdmin || memberships.some((m) => m.active && m.role === "org_admin");

    const canAdmin = canManageCadastros(memberships, isPlatformAdmin);

    return {
      /** User can view the current module */
      canView,
      /** User can perform create/edit/delete actions in the current module */
      canWrite,
      /** User is read-only (can view but not write) */
      isReadOnly: canView && !canWrite,
      /** User can manage structural cadastros (org_admin / platform_admin only) */
      canAdmin,
      /** Shorthand: is platform admin */
      isPlatformAdmin,
    };
  }, [memberships, isPlatformAdmin, location.pathname, overrideRouteKey]);
}
