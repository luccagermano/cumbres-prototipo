import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Profile = {
  id: string;
  full_name: string;
  email: string | null;
  phone_e164: string | null;
  cpf_last4: string | null;
  avatar_path: string | null;
};

type OrgMembership = {
  id: string;
  organization_id: string;
  role: string;
  active: boolean;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  memberships: OrgMembership[];
  loading: boolean;
  hasRole: (role: string) => boolean;
  isStaff: boolean;
  isCustomer: boolean;
  isExecutive: boolean;
  isPlatformAdmin: boolean;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  memberships: [],
  loading: true,
  hasRole: () => false,
  isStaff: false,
  isCustomer: false,
  isExecutive: false,
  isPlatformAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

const STAFF_ROLES = ["org_admin", "finance_agent", "support_agent", "inspection_agent", "document_agent"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [memberships, setMemberships] = useState<OrgMembership[]>([]);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    const [profileRes, membershipsRes, platformAdminRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("organization_memberships").select("id, organization_id, role, active").eq("user_id", userId).eq("active", true),
      supabase.from("platform_admins").select("user_id").eq("user_id", userId).eq("active", true).maybeSingle(),
    ]);
    if (profileRes.data) setProfile(profileRes.data as Profile);
    if (membershipsRes.data) setMemberships(membershipsRes.data as OrgMembership[]);
    setIsPlatformAdmin(!!platformAdminRes.data);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Defer data fetch to avoid Supabase deadlock
          setTimeout(() => fetchUserData(session.user.id), 0);
        } else {
          setProfile(null);
          setMemberships([]);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const hasRole = (role: string) => memberships.some((m) => m.role === role && m.active);
  const isStaff = memberships.some((m) => STAFF_ROLES.includes(m.role) && m.active);
  const isCustomer = hasRole("customer");
  const isExecutive = hasRole("executive_viewer");

  return (
    <AuthContext.Provider value={{ session, user, profile, memberships, loading, hasRole, isStaff, isCustomer, isExecutive }}>
      {children}
    </AuthContext.Provider>
  );
}
