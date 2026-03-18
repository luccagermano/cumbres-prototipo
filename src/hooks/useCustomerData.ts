import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useCustomerUnit() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["customer-unit", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: memberships, error: mErr } = await supabase
        .from("unit_memberships")
        .select("*, unit:units(*, block:blocks(*, development:developments(*)))")
        .eq("user_id", user!.id)
        .eq("active", true);

      if (mErr) throw mErr;
      return memberships ?? [];
    },
  });
}

export function useCustomerContracts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["customer-contracts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Get unit IDs the customer belongs to
      const { data: memberships } = await supabase
        .from("unit_memberships")
        .select("unit_id")
        .eq("user_id", user!.id)
        .eq("active", true);

      if (!memberships?.length) return [];

      const unitIds = memberships.map((m) => m.unit_id);
      const { data, error } = await supabase
        .from("sales_contracts")
        .select("*")
        .in("unit_id", unitIds);

      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCustomerReceivables() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["customer-receivables", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: memberships } = await supabase
        .from("unit_memberships")
        .select("unit_id")
        .eq("user_id", user!.id)
        .eq("active", true);

      if (!memberships?.length) return [];

      const unitIds = memberships.map((m) => m.unit_id);
      const { data, error } = await supabase
        .from("receivables")
        .select("*, payments(*)")
        .in("unit_id", unitIds)
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCustomerJourneyEvents() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["customer-journey", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: memberships } = await supabase
        .from("unit_memberships")
        .select("unit_id")
        .eq("user_id", user!.id)
        .eq("active", true);

      if (!memberships?.length) return [];

      const unitIds = memberships.map((m) => m.unit_id);
      const { data, error } = await supabase
        .from("journey_events")
        .select("*")
        .in("unit_id", unitIds)
        .eq("visible_to_customer", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });
}
