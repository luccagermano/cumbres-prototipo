import { motion } from "framer-motion";
import {
  Ticket, Shield, Calendar, FileText, DollarSign, Database,
  AlertTriangle, Clock, TrendingUp, Eye, CheckCircle2, FileWarning,
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
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/* ── Role detection helpers ── */

type ActiveRole =
  | "platform_admin"
  | "org_admin"
  | "executive_viewer"
  | "finance_agent"
  | "support_agent"
  | "inspection_agent"
  | "document_agent"
  | "generic";

function getPrimaryRole(
  memberships: { role: string; active: boolean }[],
  isPlatformAdmin: boolean,
): ActiveRole {
  if (isPlatformAdmin) return "platform_admin";
  const roles = memberships.filter((m) => m.active).map((m) => m.role);
  if (roles.includes("org_admin")) return "org_admin";
  if (roles.includes("executive_viewer")) return "executive_viewer";
  if (roles.includes("finance_agent")) return "finance_agent";
  if (roles.includes("support_agent")) return "support_agent";
  if (roles.includes("inspection_agent")) return "inspection_agent";
  if (roles.includes("document_agent")) return "document_agent";
  return "generic";
}

/* ── Role-specific microcopy ── */

const ROLE_COPY: Record<ActiveRole, { greeting: string; subtitle: string }> = {
  platform_admin: {
    greeting: "Painel Administrativo",
    subtitle: "Visão completa da plataforma — todos os módulos e organizações.",
  },
  org_admin: {
    greeting: "Visão Geral da Operação",
    subtitle: "Acompanhe os principais indicadores e pendências de configuração.",
  },
  executive_viewer: {
    greeting: "Visão Executiva",
    subtitle: "Monitore o andamento geral e os indicadores da operação.",
  },
  finance_agent: {
    greeting: "Central Financeira",
    subtitle: "Acompanhe movimentações, vencimentos e documentos relacionados.",
  },
  support_agent: {
    greeting: "Central de Atendimento",
    subtitle: "Priorize chamados em aberto e pendências de garantia.",
  },
  inspection_agent: {
    greeting: "Agenda Operacional",
    subtitle: "Veja os compromissos previstos para hoje e próximos dias.",
  },
  document_agent: {
    greeting: "Central de Documentos",
    subtitle: "Organize o acervo documental e acompanhe prazos de garantia.",
  },
  generic: {
    greeting: "Painel Interno",
    subtitle: "Visão geral das operações.",
  },
};

/* ── Quick-access sections (role-filtered) ── */

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

/* ── Main component ── */

export default function InternoDashboard() {
  const { user, memberships, isPlatformAdmin } = useAuth();
  const primaryRole = getPrimaryRole(memberships, isPlatformAdmin);
  const copy = ROLE_COPY[primaryRole];

  const canSeeTickets = canAccessRoute(memberships, isPlatformAdmin, "chamados");
  const canSeeWarranty = canAccessRoute(memberships, isPlatformAdmin, "garantia");
  const canSeeAgenda = canAccessRoute(memberships, isPlatformAdmin, "agenda");
  const canSeeFinanceiro = canAccessRoute(memberships, isPlatformAdmin, "financeiro");
  const canSeeDocumentos = canAccessRoute(memberships, isPlatformAdmin, "documentos");

  const sections = useMemo(
    () => allSections.filter((s) => canAccessRoute(memberships, isPlatformAdmin, s.routeKey)),
    [memberships, isPlatformAdmin],
  );

  // ── Queries ──
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

  const { data: upcomingInspections } = useQuery({
    queryKey: ["interno-upcoming-inspections"],
    enabled: !!user && canSeeAgenda,
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("inspection_bookings")
        .select("id, scheduled_at, booking_status, unit_id")
        .gte("scheduled_at", now)
        .order("scheduled_at", { ascending: true })
        .limit(10);
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

  const { data: receivables } = useQuery({
    queryKey: ["interno-receivables-all"],
    enabled: !!user && canSeeFinanceiro,
    queryFn: async () => {
      const { data } = await supabase
        .from("receivables")
        .select("id, status, due_date, total_amount")
        .order("due_date", { ascending: true });
      return data ?? [];
    },
  });

  const { data: documentsTotal } = useQuery({
    queryKey: ["interno-documents-total"],
    enabled: !!user && canSeeDocumentos,
    queryFn: async () => {
      const { data } = await supabase.from("documents").select("id, created_at").order("created_at", { ascending: false });
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
  const topCategories = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const pendingReceivables = receivables?.filter((r) => r.status === "pending") ?? [];
  const overdueReceivables = receivables?.filter((r) => r.status === "overdue") ?? [];
  const paidReceivables = receivables?.filter((r) => r.status === "paid") ?? [];

  const isReadOnly = primaryRole === "executive_viewer";

  // ── KPIs (role-aware) ──
  const kpis = [
    ...(canSeeTickets ? [{
      title: "Chamados Abertos",
      value: openTickets.length,
      icon: Ticket,
      subtitle: highPriority.length ? `${highPriority.length} urgente(s)` : "Nenhum urgente",
    }] : []),
    ...(canSeeWarranty ? [{
      title: "Garantias Ativas",
      value: warrantyRules?.length ?? 0,
      icon: Shield,
      subtitle: "Regras cadastradas",
    }] : []),
    ...(canSeeAgenda ? [{
      title: "Vistorias Hoje",
      value: todayInspections?.length ?? 0,
      icon: Calendar,
      subtitle: todayInspections?.length ? "Agendadas" : "Agenda livre",
    }] : []),
    ...(canSeeFinanceiro ? [{
      title: "Cobranças Pendentes",
      value: pendingReceivables.length + overdueReceivables.length,
      icon: DollarSign,
      subtitle: overdueReceivables.length ? `${overdueReceivables.length} vencida(s)` : "Nenhuma vencida",
    }] : []),
    ...(canSeeDocumentos ? [{
      title: "Documentos",
      value: documentsTotal?.length ?? 0,
      icon: FileText,
      subtitle: "No acervo",
    }] : []),
  ];

  const kpiGridCols =
    kpis.length <= 1 ? "sm:grid-cols-1 max-w-xs"
    : kpis.length === 2 ? "sm:grid-cols-2 max-w-2xl"
    : kpis.length === 3 ? "sm:grid-cols-3"
    : kpis.length === 4 ? "sm:grid-cols-2 lg:grid-cols-4"
    : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5";

  const quickGridCols =
    sections.length <= 1 ? "sm:grid-cols-1 max-w-sm"
    : sections.length === 2 ? "sm:grid-cols-2 max-w-2xl"
    : sections.length <= 4 ? "sm:grid-cols-2 lg:grid-cols-2"
    : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div>
      {/* Header with role badge */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-1">
        <PageHeader title={copy.greeting} description={copy.subtitle} />
        {isReadOnly && (
          <StatusChip variant="info" label="Somente consulta" className="mt-1.5" />
        )}
      </div>

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

      {/* ── Role-specific widget area ── */}
      <DashboardWidgets
        primaryRole={primaryRole}
        canSeeTickets={canSeeTickets}
        canSeeWarranty={canSeeWarranty}
        canSeeAgenda={canSeeAgenda}
        canSeeFinanceiro={canSeeFinanceiro}
        canSeeDocumentos={canSeeDocumentos}
        recentTickets={recentTickets}
        topCategories={topCategories}
        openTickets={openTickets}
        highPriority={highPriority}
        upcomingInspections={upcomingInspections ?? []}
        todayInspections={todayInspections ?? []}
        pendingReceivables={pendingReceivables}
        overdueReceivables={overdueReceivables}
        paidReceivables={paidReceivables}
        warrantyRules={warrantyRules ?? []}
        documentsTotal={documentsTotal ?? []}
      />

      {/* Quick access */}
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

/* ════════════════════════════════════════════════════════════
   Widgets area — composed per role
   ════════════════════════════════════════════════════════════ */

type Ticket = { id: string; category_name: string; internal_status: string; priority: string; opened_at: string; assigned_to: string | null; unit_id: string };
type Inspection = { id: string; scheduled_at: string | null; booking_status?: string; unit_id?: string };
type Receivable = { id: string; status: string; due_date: string; total_amount: number };

interface WidgetProps {
  primaryRole: ActiveRole;
  canSeeTickets: boolean;
  canSeeWarranty: boolean;
  canSeeAgenda: boolean;
  canSeeFinanceiro: boolean;
  canSeeDocumentos: boolean;
  recentTickets: Ticket[];
  topCategories: [string, number][];
  openTickets: Ticket[];
  highPriority: Ticket[];
  upcomingInspections: Inspection[];
  todayInspections: Inspection[];
  pendingReceivables: Receivable[];
  overdueReceivables: Receivable[];
  paidReceivables: Receivable[];
  warrantyRules: { id: string }[];
  documentsTotal: { id: string; created_at: string }[];
}

function DashboardWidgets(props: WidgetProps) {
  const { primaryRole } = props;

  // inspection_agent: hero agenda
  if (primaryRole === "inspection_agent") {
    return <AgendaHeroWidget {...props} />;
  }

  // finance_agent: finance-first layout
  if (primaryRole === "finance_agent") {
    return <FinanceWidgets {...props} />;
  }

  // support_agent: support-first layout
  if (primaryRole === "support_agent") {
    return <SupportWidgets {...props} />;
  }

  // document_agent: docs-first layout
  if (primaryRole === "document_agent") {
    return <DocumentWidgets {...props} />;
  }

  // org_admin, executive_viewer, platform_admin, generic: full overview
  return <FullOverviewWidgets {...props} />;
}

/* ── Full overview (admin / exec / platform) ── */

function FullOverviewWidgets(props: WidgetProps) {
  return (
    <div className="space-y-6 mb-8">
      {props.canSeeTickets && <TicketQueueWidget recentTickets={props.recentTickets} topCategories={props.topCategories} />}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {props.canSeeAgenda && <UpcomingAgendaWidget inspections={props.upcomingInspections} todayCount={props.todayInspections.length} />}
        {props.canSeeFinanceiro && <FinanceSummaryWidget pending={props.pendingReceivables} overdue={props.overdueReceivables} paid={props.paidReceivables} />}
        {props.canSeeDocumentos && <DocumentSummaryWidget documents={props.documentsTotal} />}
      </div>
    </div>
  );
}

/* ── Finance agent widgets ── */

function FinanceWidgets(props: WidgetProps) {
  return (
    <div className="space-y-6 mb-8">
      <div className="grid md:grid-cols-2 gap-4">
        <FinanceSummaryWidget pending={props.pendingReceivables} overdue={props.overdueReceivables} paid={props.paidReceivables} expanded />
        <div className="space-y-4">
          {props.canSeeDocumentos && <DocumentSummaryWidget documents={props.documentsTotal} />}
          {props.canSeeAgenda && <UpcomingAgendaWidget inspections={props.upcomingInspections} todayCount={props.todayInspections.length} compact />}
        </div>
      </div>
    </div>
  );
}

/* ── Support agent widgets ── */

function SupportWidgets(props: WidgetProps) {
  return (
    <div className="space-y-6 mb-8">
      {props.canSeeTickets && <TicketQueueWidget recentTickets={props.recentTickets} topCategories={props.topCategories} />}
      <div className="grid md:grid-cols-2 gap-4">
        {props.canSeeWarranty && (
          <div className="glass-card p-6">
            <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Garantias
            </h3>
            <p className="text-2xl font-bold text-foreground">{props.warrantyRules.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Regras ativas cadastradas</p>
          </div>
        )}
        {props.canSeeAgenda && <UpcomingAgendaWidget inspections={props.upcomingInspections} todayCount={props.todayInspections.length} compact />}
      </div>
    </div>
  );
}

/* ── Document agent widgets ── */

function DocumentWidgets(props: WidgetProps) {
  return (
    <div className="space-y-6 mb-8">
      <div className="grid md:grid-cols-2 gap-4">
        <DocumentSummaryWidget documents={props.documentsTotal} expanded />
        <div className="space-y-4">
          {props.canSeeWarranty && (
            <div className="glass-card p-6">
              <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Garantias Vinculadas
              </h3>
              <p className="text-2xl font-bold text-foreground">{props.warrantyRules.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Regras ativas para referência</p>
            </div>
          )}
          {props.canSeeAgenda && <UpcomingAgendaWidget inspections={props.upcomingInspections} todayCount={props.todayInspections.length} compact />}
        </div>
      </div>
    </div>
  );
}

/* ── Inspection agent: hero agenda ── */

function AgendaHeroWidget(props: WidgetProps) {
  const today = props.todayInspections;
  const upcoming = props.upcomingInspections.filter((i) => {
    if (!i.scheduled_at) return false;
    return !isToday(parseISO(i.scheduled_at));
  }).slice(0, 6);

  return (
    <div className="mb-8">
      {/* Hero card */}
      <div className="glass-card p-8 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-primary/10">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">Compromissos de Hoje</h2>
            <p className="text-sm text-muted-foreground">
              {today.length === 0
                ? "Nenhuma vistoria agendada para hoje."
                : `${today.length} vistoria(s) prevista(s) para hoje.`}
            </p>
          </div>
        </div>
        {today.length > 0 && (
          <div className="space-y-2 mt-4">
            {today.map((insp) => (
              <div key={insp.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {insp.scheduled_at ? format(parseISO(insp.scheduled_at), "HH:mm", { locale: ptBR }) : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">Vistoria #{insp.id.slice(0, 8)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Próximos Compromissos
          </h3>
          <div className="space-y-2">
            {upcoming.map((insp) => {
              const dt = insp.scheduled_at ? parseISO(insp.scheduled_at) : null;
              return (
                <div key={insp.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3 min-w-0">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {dt ? format(dt, "dd/MM · HH:mm", { locale: ptBR }) : "Sem data"}
                      </p>
                      <p className="text-xs text-muted-foreground">#{insp.id.slice(0, 8)}</p>
                    </div>
                  </div>
                  {dt && isTomorrow(dt) && <StatusChip variant="info" label="Amanhã" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Shared widget components
   ════════════════════════════════════════════════════════════ */

function TicketQueueWidget({ recentTickets, topCategories }: { recentTickets: Ticket[]; topCategories: [string, number][] }) {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
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
  );
}

function UpcomingAgendaWidget({ inspections, todayCount, compact }: { inspections: Inspection[]; todayCount: number; compact?: boolean }) {
  const next = inspections.slice(0, compact ? 3 : 5);
  return (
    <div className="glass-card p-6">
      <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
        <Calendar className="h-4 w-4 text-primary" />
        Agenda
      </h3>
      <p className="text-xs text-muted-foreground mb-3">
        {todayCount > 0 ? `${todayCount} compromisso(s) hoje` : "Nenhum compromisso hoje"}
      </p>
      {next.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem compromissos próximos.</p>
      ) : (
        <div className="space-y-2">
          {next.map((insp) => {
            const dt = insp.scheduled_at ? parseISO(insp.scheduled_at) : null;
            return (
              <div key={insp.id} className="flex items-center gap-2 text-sm">
                <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-foreground">{dt ? format(dt, "dd/MM · HH:mm", { locale: ptBR }) : "Sem data"}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FinanceSummaryWidget({ pending, overdue, paid, expanded }: { pending: Receivable[]; overdue: Receivable[]; paid: Receivable[]; expanded?: boolean }) {
  const totalPending = pending.reduce((s, r) => s + r.total_amount, 0);
  const totalOverdue = overdue.reduce((s, r) => s + r.total_amount, 0);

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="glass-card p-6">
      <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-primary" />
        Resumo Financeiro
      </h3>
      <div className={cn("grid gap-4", expanded ? "grid-cols-1" : "grid-cols-1")}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Pendentes</span>
            <span className="text-sm font-semibold text-foreground">{pending.length} — {fmt(totalPending)}</span>
          </div>
          {overdue.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Vencidas
              </span>
              <span className="text-sm font-semibold text-destructive">{overdue.length} — {fmt(totalOverdue)}</span>
            </div>
          )}
          {expanded && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Recebidas
              </span>
              <span className="text-sm font-semibold text-foreground">{paid.length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DocumentSummaryWidget({ documents, expanded }: { documents: { id: string; created_at: string }[]; expanded?: boolean }) {
  const recentCount = documents.filter((d) => {
    const diff = Date.now() - new Date(d.created_at).getTime();
    return diff < 7 * 24 * 60 * 60 * 1000; // last 7 days
  }).length;

  return (
    <div className="glass-card p-6">
      <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        Documentos
      </h3>
      <p className="text-2xl font-bold text-foreground">{documents.length}</p>
      <p className="text-xs text-muted-foreground mt-1">
        {recentCount > 0 ? `${recentCount} adicionado(s) nos últimos 7 dias` : "Nenhum recente"}
      </p>
      {expanded && (
        <p className="text-xs text-muted-foreground mt-2">Mantenha o acervo organizado e atualizado.</p>
      )}
    </div>
  );
}
