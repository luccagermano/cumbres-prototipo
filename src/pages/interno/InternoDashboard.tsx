import { motion } from "framer-motion";
import {
  Ticket, Shield, Calendar, FileText, DollarSign, Database,
  AlertTriangle, Clock,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusChip } from "@/components/ui/status-chip";
import { canAccessRoute } from "@/lib/internal-permissions";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

const allSections = [
  { label: "Chamados", path: "/interno/chamados", icon: Ticket, description: "Gestão de tickets e atendimento", routeKey: "chamados" as const },
  { label: "Garantia", path: "/interno/garantia", icon: Shield, description: "Solicitações de garantia", routeKey: "garantia" as const },
  { label: "Agenda", path: "/interno/agenda", icon: Calendar, description: "Calendário e vistorias", routeKey: "agenda" as const },
  { label: "Documentos", path: "/interno/documentos", icon: FileText, description: "Gestão documental", routeKey: "documentos" as const },
  { label: "Financeiro", path: "/interno/financeiro", icon: DollarSign, description: "Relatórios e cobranças", routeKey: "financeiro" as const },
  { label: "Cadastros", path: "/interno/cadastros", icon: Database, description: "Dados mestres e configurações", routeKey: "cadastros" as const },
];

const statusMap: Record<string, { variant: "success" | "warning" | "error" | "info" | "neutral"; label: string }> = {
  open: { variant: "warning", label: "Aberto" },
  in_progress: { variant: "info", label: "Em andamento" },
  waiting_customer: { variant: "neutral", label: "Aguardando cliente" },
  resolved: { variant: "success", label: "Resolvido" },
  closed: { variant: "success", label: "Fechado" },
};

/** Role-aware greeting */
function getRoleGreeting(memberships: { role: string; active: boolean }[], isPlatformAdmin: boolean): string {
  if (isPlatformAdmin) return "Visão completa da plataforma.";
  const roles = memberships.filter((m) => m.active).map((m) => m.role);
  if (roles.includes("org_admin")) return "Visão geral das operações.";
  if (roles.includes("executive_viewer")) return "Acompanhamento executivo das operações.";
  if (roles.includes("finance_agent")) return "Resumo financeiro e documental.";
  if (roles.includes("support_agent")) return "Resumo de atendimento e garantia.";
  if (roles.includes("inspection_agent")) return "Resumo das vistorias agendadas.";
  if (roles.includes("document_agent")) return "Resumo documental e garantias.";
  return "Visão geral das operações.";
}

export default function InternoDashboard() {
  const { user, memberships, isPlatformAdmin } = useAuth();

  const sections = useMemo(
    () => allSections.filter((s) => canAccessRoute(memberships, isPlatformAdmin, s.routeKey)),
    [memberships, isPlatformAdmin]
  );

  const canSeeTickets = canAccessRoute(memberships, isPlatformAdmin, "chamados");
  const canSeeWarranty = canAccessRoute(memberships, isPlatformAdmin, "garantia");
  const canSeeAgenda = canAccessRoute(memberships, isPlatformAdmin, "agenda");
  const canSeeFinanceiro = canAccessRoute(memberships, isPlatformAdmin, "financeiro");
  const canSeeDocumentos = canAccessRoute(memberships, isPlatformAdmin, "documentos");

  // ── Queries (only when role allows) ──
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

  const { data: receivablesOpen } = useQuery({
    queryKey: ["interno-receivables-open"],
    enabled: !!user && canSeeFinanceiro,
    queryFn: async () => {
      const { data } = await supabase
        .from("receivables")
        .select("id")
        .in("status", ["pending", "overdue"]);
      return data ?? [];
    },
  });

  const { data: documentsTotal } = useQuery({
    queryKey: ["interno-documents-total"],
    enabled: !!user && canSeeDocumentos,
    queryFn: async () => {
      const { data } = await supabase.from("documents").select("id");
      return data ?? [];
    },
  });

  // ── Derived data ──
  const openTickets = tickets?.filter((t) => !["resolved", "closed"].includes(t.internal_status)) ?? [];
  const highPriority = openTickets.filter((t) => t.priority === "high" || t.priority === "urgent");
  const recentTickets = tickets?.slice(0, 8) ?? [];

  const categoryCount: Record<string, number> = {};
  openTickets.forEach((t) => {
    categoryCount[t.category_name] = (categoryCount[t.category_name] || 0) + 1;
  });
  const topCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // ── KPIs (role-aware) ──
  const kpis = [
    ...(canSeeTickets ? [{ title: "Chamados Abertos", value: openTickets.length, icon: Ticket, subtitle: highPriority.length ? `${highPriority.length} urgente(s)` : "Nenhum urgente" }] : []),
    ...(canSeeWarranty ? [{ title: "Garantias Ativas", value: warrantyRules?.length ?? 0, icon: Shield, subtitle: "Regras cadastradas" }] : []),
    ...(canSeeAgenda ? [{ title: "Vistorias Hoje", value: todayInspections?.length ?? 0, icon: Calendar, subtitle: todayInspections?.length ? "Agendadas" : "Agenda livre" }] : []),
    ...(canSeeFinanceiro ? [{ title: "Cobranças em Aberto", value: receivablesOpen?.length ?? 0, icon: DollarSign, subtitle: "Parcelas pendentes" }] : []),
    ...(canSeeDocumentos ? [{ title: "Documentos", value: documentsTotal?.length ?? 0, icon: FileText, subtitle: "No acervo" }] : []),
  ];

  const greeting = getRoleGreeting(memberships, isPlatformAdmin);

  // Grid cols for KPIs based on count
  const kpiGridCols =
    kpis.length <= 1 ? "sm:grid-cols-1 max-w-xs"
    : kpis.length === 2 ? "sm:grid-cols-2 max-w-2xl"
    : kpis.length === 3 ? "sm:grid-cols-3"
    : kpis.length === 4 ? "sm:grid-cols-2 lg:grid-cols-4"
    : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5";

  // Grid cols for quick access based on count
  const quickGridCols =
    sections.length <= 1 ? "sm:grid-cols-1 max-w-sm"
    : sections.length === 2 ? "sm:grid-cols-2 max-w-2xl"
    : sections.length <= 4 ? "sm:grid-cols-2 lg:grid-cols-2"
    : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div>
      <PageHeader title="Painel Interno" description={greeting} />

      {/* KPI Row */}
      {kpis.length > 0 && (
        <div className={cn("grid gap-4 mb-8", kpiGridCols)}>
          {kpis.map((kpi, i) => (
            <motion.div key={kpi.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <KpiCard title={kpi.title} value={kpi.value} icon={kpi.icon} subtitle={kpi.subtitle} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Ticket queue + Categories – only for roles that can see tickets */}
      {canSeeTickets && (
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
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
                  const st = statusMap[t.internal_status] ?? { variant: "neutral" as const, label: t.internal_status };
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
      )}

      {/* Quick links */}
      <h2 className="font-display text-lg font-semibold text-foreground mb-4">Acesso Rápido</h2>
      <div className={cn("grid gap-4", quickGridCols)}>
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
