/**
 * Centralized role-based access matrix for the internal panel (/interno).
 * Platform admins bypass all checks. org_admin and executive_viewer see everything.
 */

export type InternalRole =
  | "org_admin"
  | "finance_agent"
  | "support_agent"
  | "inspection_agent"
  | "document_agent"
  | "executive_viewer";

type RouteKey =
  | "dashboard"
  | "cadastros"
  | "chamados"
  | "garantia"
  | "agenda"
  | "documentos"
  | "financeiro";

/**
 * Maps each role to the route keys it can access.
 * org_admin and executive_viewer have access to everything.
 */
const ACCESS_MATRIX: Record<InternalRole, readonly RouteKey[]> = {
  org_admin: ["dashboard", "cadastros", "chamados", "garantia", "agenda", "documentos", "financeiro"],
  executive_viewer: ["dashboard", "cadastros", "chamados", "garantia", "agenda", "documentos", "financeiro"],
  finance_agent: ["dashboard", "financeiro", "documentos", "agenda"],
  support_agent: ["dashboard", "chamados", "garantia", "agenda"],
  inspection_agent: ["dashboard", "agenda"],
  document_agent: ["dashboard", "documentos", "agenda", "garantia"],
};

/**
 * Map path prefixes to route keys.
 */
const PATH_TO_KEY: { prefix: string; key: RouteKey }[] = [
  { prefix: "/interno/cadastros", key: "cadastros" },
  { prefix: "/interno/chamados", key: "chamados" },
  { prefix: "/interno/garantia", key: "garantia" },
  { prefix: "/interno/agenda", key: "agenda" },
  { prefix: "/interno/documentos", key: "documentos" },
  { prefix: "/interno/financeiro", key: "financeiro" },
];

export function getRouteKeyFromPath(pathname: string): RouteKey | null {
  for (const { prefix, key } of PATH_TO_KEY) {
    if (pathname.startsWith(prefix)) return key;
  }
  if (pathname === "/interno") return "dashboard";
  return null;
}

export type Membership = { role: string; active: boolean };

/**
 * Check if a user can access a given route key.
 * Platform admins always return true (check externally).
 */
export function canAccessRoute(
  memberships: Membership[],
  isPlatformAdmin: boolean,
  routeKey: RouteKey
): boolean {
  if (isPlatformAdmin) return true;
  return memberships.some(
    (m) =>
      m.active &&
      ACCESS_MATRIX[m.role as InternalRole]?.includes(routeKey)
  );
}

/**
 * Check if a user can access a given pathname.
 */
export function canAccessPath(
  memberships: Membership[],
  isPlatformAdmin: boolean,
  pathname: string
): boolean {
  if (isPlatformAdmin) return true;
  const key = getRouteKeyFromPath(pathname);
  if (!key) return true; // unknown routes are allowed (handled by 404)
  return canAccessRoute(memberships, isPlatformAdmin, key);
}

/**
 * Filter sidebar items based on role access.
 */
export function filterSidebarItems<T extends { path: string }>(
  items: T[],
  memberships: Membership[],
  isPlatformAdmin: boolean
): T[] {
  if (isPlatformAdmin) return items;
  return items.filter((item) => canAccessPath(memberships, isPlatformAdmin, item.path));
}

/**
 * Sidebar route key mapping for convenience.
 */
export const SIDEBAR_ROUTE_KEYS: Record<string, RouteKey> = {
  "/interno": "dashboard",
  "/interno/cadastros": "cadastros",
  "/interno/chamados": "chamados",
  "/interno/garantia": "garantia",
  "/interno/agenda": "agenda",
  "/interno/documentos": "documentos",
  "/interno/financeiro": "financeiro",
};
