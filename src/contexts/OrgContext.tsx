import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type OrgData = {
  id: string;
  name: string;
  slug: string;
  logo_path: string | null;
  brand_primary_color: string | null;
  brand_secondary_color: string | null;
};

type OrgContextType = {
  org: OrgData | null;
  logoUrl: string | null;
  orgInitials: string | null;
  loading: boolean;
  /** Manually set the active org (e.g. for multi-org admins) */
  setActiveOrgId: (id: string) => void;
  /** The resolved org ID before org data is fetched */
  activeOrgId: string | null;
};

const ORG_STORAGE_KEY = "app_active_org_id";
const AREA_STORAGE_KEY = "app_last_area";

/** Persist last-used area for session restore */
export function setLastArea(area: string) {
  try { sessionStorage.setItem(AREA_STORAGE_KEY, area); } catch {}
}
export function getLastArea(): string | null {
  try { return sessionStorage.getItem(AREA_STORAGE_KEY); } catch { return null; }
}

const OrgContext = createContext<OrgContextType>({
  org: null,
  logoUrl: null,
  orgInitials: null,
  loading: true,
  setActiveOrgId: () => {},
  activeOrgId: null,
});

export const useOrg = () => useContext(OrgContext);

function getSavedOrgId(): string | null {
  try { return sessionStorage.getItem(ORG_STORAGE_KEY); } catch { return null; }
}

export function OrgProvider({ children }: { children: ReactNode }) {
  const { session, user, memberships } = useAuth();
  const [manualOrgId, setManualOrgId] = useState<string | null>(getSavedOrgId);

  const setActiveOrgId = useCallback((id: string) => {
    setManualOrgId(id);
    try { sessionStorage.setItem(ORG_STORAGE_KEY, id); } catch {}
  }, []);

  // Staff org IDs from organization_memberships
  const staffOrgIds = [...new Set(memberships.filter(m => m.active).map(m => m.organization_id))];

  // If manual selection exists and is still valid for staff, use it
  const staffOrgId = manualOrgId && staffOrgIds.includes(manualOrgId)
    ? manualOrgId
    : staffOrgIds[0] ?? null;

  // For customers without org memberships: resolve through unit chain
  const { data: customerOrgId } = useQuery({
    queryKey: ["customer-org-resolve", user?.id],
    enabled: !!user && !staffOrgId,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("unit_memberships")
        .select("unit:units(block:blocks(development:developments(organization_id)))")
        .eq("user_id", user!.id)
        .eq("active", true)
        .limit(1);

      if (!data?.length) return null;
      const unit = data[0].unit as any;
      return unit?.block?.development?.organization_id ?? null;
    },
  });

  // Use manual selection if set (for platform admins), otherwise auto-resolved
  const resolvedOrgId = manualOrgId && !staffOrgIds.length && !customerOrgId
    ? manualOrgId // platform admin with manual selection
    : staffOrgId || customerOrgId || manualOrgId || null;

  // Fetch organization data
  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ["active-org", resolvedOrgId],
    enabled: !!session && !!resolvedOrgId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("organizations")
        .select("id, name, slug, logo_path, brand_primary_color, brand_secondary_color")
        .eq("id", resolvedOrgId!)
        .single();
      return (data as OrgData) ?? null;
    },
  });

  // Signed URL for logo
  const { data: logoUrl } = useQuery({
    queryKey: ["active-org-logo", org?.logo_path],
    enabled: !!org?.logo_path,
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.storage
        .from("organization-assets-private")
        .createSignedUrl(org!.logo_path!, 3600);
      return data?.signedUrl ?? null;
    },
  });

  const orgInitials = org?.name
    ? org.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
    : null;

  const loading = !!session && !resolvedOrgId && orgLoading;

  return (
    <OrgContext.Provider value={{
      org: org ?? null,
      logoUrl: logoUrl ?? null,
      orgInitials,
      loading,
      setActiveOrgId,
      activeOrgId: resolvedOrgId,
    }}>
      {children}
    </OrgContext.Provider>
  );
}
