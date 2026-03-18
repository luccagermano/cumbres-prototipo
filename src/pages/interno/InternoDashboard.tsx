import { motion } from "framer-motion";
import { Ticket, Shield, Calendar, FileText, DollarSign, Users, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusChip } from "@/components/ui/status-chip";
import { EmptyState } from "@/components/EmptyState";
import { canAccessRoute } from "@/lib/internal-permissions";
import { useMemo } from "react";

const allSections = [
  { label: "Chamados", path: "/interno/chamados", icon: Ticket, description: "Gestão de tickets e atendimento", routeKey: "chamados" as const },
  { label: "Garantia", path: "/interno/garantia", icon: Shield, description: "Solicitações de garantia", routeKey: "garantia" as const },
  { label: "Agenda", path: "/interno/agenda", icon: Calendar, description: "Calendário da equipe", routeKey: "agenda" as const },
  { label: "Documentos", path: "/interno/documentos", icon: FileText, description: "Documentos internos", routeKey: "documentos" as const },
  { label: "Financeiro", path: "/interno/financeiro", icon: DollarSign, description: "Relatórios financeiros", routeKey: "financeiro" as const },
];

const statusMap: Record<string, { variant: "success" | "warning" | "error" | "info" | "neutral"; label: string }> = {
  open: { variant: "warning", label: "Aberto" },
  in_progress: { variant: "info", label: "Em andamento" },
  waiting_customer: { variant: "neutral", label: "Aguardando cliente" },
  resolved: { variant: "success", label: "Resolvido" },
  closed: { variant: "success", label: "Fechado" },
};

export default function InternoDashboard() {
  const { user, memberships, isPlatformAdmin } = useAuth();

  const sections = useMemo(
    () => allSections.filter((s) => canAccessRoute(memberships, isPlatformAdmin, s.routeKey)),
    [memberships, isPlatformAdmin]
  );

  const canSeeTickets = canAccessRoute(memberships, isPlatformAdmin, "chamados");
  const canSeeWarranty = canAccessRoute(memberships, isPlatformAdmin, "garantia");
  const canSeeAgenda = canAccessRoute(memberships, isPlatformAdmin, "agenda");

  const { data: tickets } = useQuery({
    queryKey: ["interno-tickets-summary"],
    enabled: !!user && canSeeTickets,
    queryFn: async () => {
      const { data } = await supabase
        .from("tickets")
        .select("id, category_name, internal_status, priority, opened_at, assigned_to, unit_id")
        .order("opened_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: warrantyRules } = useQuery({
    queryKey: ["interno-warranty-count"],
    enabled: !!user && canSeeWarranty,
    queryFn: async () => {
      const { data } = await supabase.from("warranty_rules").select("id").eq("active", true);
      return data ?? [];
    },
  });

  const { data: todayInspections } = useQuery({
    queryKey: ["interno-today-inspections"],
    enabled: !!user && canSeeAgenda,
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("inspection_bookings")
        .select("id, scheduled_at")
        .gte("scheduled_at", `${today}T00:00:00`)
        .lte("scheduled_at", `${today}T23:59:59`);
      return data ?? [];
    },
  });

  const openTickets = tickets?.filter((t) => !["resolved", "closed"].includes(t.internal_status)) ?? [];
  const highPriority = openTickets.filter((t) => t.priority === "high" || t.priority === "urgent");
  const recentTickets = tickets?.slice(0, 8) ?? [];

  // Category breakdown
  const categoryCount: Record<string, number> = {};
  openTickets.forEach((t) => {
    categoryCount[t.category_name] = (categoryCount[t.category_name] || 0) + 1;
  });
  const topCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const kpis = [
    ...(canSeeTickets ? [{ title: "Chamados Abertos", value: openTickets.length, icon: Ticket, subtitle: highPriority.length ? `${highPriority.length} urgente(s)` : "Nenhum urgente" }] : []),
    ...(canSeeWarranty ? [{ title: "Garantias Ativas", value: warrantyRules?.length ?? 0, icon: Shield, subtitle: "Regras cadastradas" }] : []),
    ...(canSeeAgenda ? [{ title: "Vistorias Hoje", value: todayInspections?.length ?? 0, icon: Calendar, subtitle: todayInspections?.length ? "Agendadas" : "Agenda livre" }] : []),
  ];

  return (
    <div>
      <PageHeader title="Painel Interno" description="Visão geral das operações." />

      {kpis.length > 0 && (
        <div className={cn("grid gap-4 mb-8", kpis.length === 1 ? "sm:grid-cols-1 max-w-sm" : kpis.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3")}>
          {kpis.map((kpi, i) => (
            <motion.div key={kpi.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <KpiCard title={kpi.title} value={kpi.value} icon={kpi.icon} subtitle={kpi.subtitle} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Ticket queue + Categories */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Recent tickets */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <Ticket className="h-4 w-4 text-primary" />
            Fila de Chamados
          </h3>
          {recentTickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum chamado registrado.</p>
          ) : (
            <div className="space-y-2">
              {recentTickets.map((t) => {
                const st = statusMap[t.internal_status] ?? { variant: "default" as const, label: t.internal_status };
                return (
                  <Link
                    key={t.id}
                    to={`/interno/chamados/${t.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {t.priority === "urgent" || t.priority === "high" ? (
                        <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{t.category_name}</p>
                        <p className="text-xs text-muted-foreground">#{t.id.slice(0, 8)}</p>
                      </div>
                    </div>
                    <StatusChip variant={st.variant as any} label={st.label} />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Categories breakdown */}
        <div className="glass-card p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Categorias Abertas</h3>
          {topCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem chamados abertos.</p>
          ) : (
            <div className="space-y-3">
              {topCategories.map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{cat}</span>
                  <span className="text-sm font-semibold text-primary">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <h2 className="font-display text-lg font-semibold text-foreground mb-4">Acesso Rápido</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((item, i) => (
          <motion.div key={item.path} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.06 }}>
            <Link to={item.path} className="glass-card p-5 block hover:shadow-lg hover:scale-[1.01] transition-all group">
              <div className="p-2 rounded-xl bg-primary/10 w-fit mb-3 group-hover:bg-primary/15 transition-colors">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-sm text-foreground mb-0.5">{item.label}</h3>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
