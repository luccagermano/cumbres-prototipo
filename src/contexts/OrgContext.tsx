import { createContext, useContext, ReactNode } from "react";
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
};

const OrgContext = createContext<OrgContextType>({
  org: null,
  logoUrl: null,
  orgInitials: null,
  loading: true,
});

export const useOrg = () => useContext(OrgContext);

export function OrgProvider({ children }: { children: ReactNode }) {
  const { session, user, memberships, isPlatformAdmin } = useAuth();

  // For staff/internal: resolve from organization_memberships
  const staffOrgIds = [...new Set(memberships.filter(m => m.active).map(m => m.organization_id))];
  const staffOrgId = staffOrgIds[0] ?? null;

  // For customers: resolve org through unit_memberships -> units -> blocks -> developments
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

  const resolvedOrgId = staffOrgId || customerOrgId || null;

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

  // Generate signed URL for logo
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
    <OrgContext.Provider value={{ org: org ?? null, logoUrl: logoUrl ?? null, orgInitials, loading }}>
      {children}
    </OrgContext.Provider>
  );
}
