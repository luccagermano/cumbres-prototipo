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

export type RouteKey =
  | "dashboard"
  | "cadastros"
  | "chamados"
  | "garantia"
  | "agenda"
  | "documentos"
  | "financeiro";

/**
 * Maps each role to the route keys it can access.
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
 * Maps each role to the route keys where it can perform WRITE actions (create/edit/delete).
 * executive_viewer is read-only everywhere.
 */
const WRITE_MATRIX: Record<InternalRole, readonly RouteKey[]> = {
  org_admin: ["dashboard", "cadastros", "chamados", "garantia", "agenda", "documentos", "financeiro"],
  executive_viewer: [], // read-only
  finance_agent: ["financeiro", "documentos"],
  support_agent: ["chamados", "garantia"],
  inspection_agent: ["agenda"],
  document_agent: ["documentos", "garantia"],
};

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

/** Check if user can VIEW a route. */
export function canAccessRoute(
  memberships: Membership[],
  isPlatformAdmin: boolean,
  routeKey: RouteKey
): boolean {
  if (isPlatformAdmin) return true;
  return memberships.some(
    (m) => m.active && ACCESS_MATRIX[m.role as InternalRole]?.includes(routeKey)
  );
}

/** Check if user can perform WRITE actions on a given module. */
export function canWriteModule(
  memberships: Membership[],
  isPlatformAdmin: boolean,
  routeKey: RouteKey
): boolean {
  if (isPlatformAdmin) return true;
  return memberships.some(
    (m) => m.active && WRITE_MATRIX[m.role as InternalRole]?.includes(routeKey)
  );
}

/** Check if user can write in cadastros (structural admin). Only org_admin + platform_admin. */
export function canManageCadastros(
  memberships: Membership[],
  isPlatformAdmin: boolean
): boolean {
  if (isPlatformAdmin) return true;
  return memberships.some(
    (m) => m.active && m.role === "org_admin"
  );
}

export function canAccessPath(
  memberships: Membership[],
  isPlatformAdmin: boolean,
  pathname: string
): boolean {
  if (isPlatformAdmin) return true;
  const key = getRouteKeyFromPath(pathname);
  if (!key) return true;
  return canAccessRoute(memberships, isPlatformAdmin, key);
}

export function filterSidebarItems<T extends { path: string }>(
  items: T[],
  memberships: Membership[],
  isPlatformAdmin: boolean
): T[] {
  if (isPlatformAdmin) return items;
  return items.filter((item) => canAccessPath(memberships, isPlatformAdmin, item.path));
}

export const SIDEBAR_ROUTE_KEYS: Record<string, RouteKey> = {
  "/interno": "dashboard",
  "/interno/cadastros": "cadastros",
  "/interno/chamados": "chamados",
  "/interno/garantia": "garantia",
  "/interno/agenda": "agenda",
  "/interno/documentos": "documentos",
  "/interno/financeiro": "financeiro",
};
