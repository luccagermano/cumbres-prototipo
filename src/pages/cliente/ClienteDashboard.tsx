import { motion } from "framer-motion";
import { Building, DollarSign, FileText, Wrench, Bell, Calendar, Bot, ClipboardCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Timeline } from "@/components/ui/timeline";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomerUnit, useCustomerReceivables, useCustomerJourneyEvents } from "@/hooks/useCustomerData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const quickLinks = [
  { label: "Minha Unidade", path: "/cliente/unidade", icon: Building, description: "Dados e progresso da unidade" },
  { label: "Financeiro", path: "/cliente/financeiro", icon: DollarSign, description: "Boletos e pagamentos" },
  { label: "Documentos", path: "/cliente/documentos", icon: FileText, description: "Contratos e arquivos" },
  { label: "Vistoria", path: "/cliente/vistoria", icon: ClipboardCheck, description: "Agendamentos e laudos" },
  { label: "Assistência", path: "/cliente/assistencia", icon: Wrench, description: "Solicitar atendimento técnico" },
  { label: "Notificações", path: "/cliente/notificacoes", icon: Bell, description: "Avisos e comunicados" },
  { label: "Calendário", path: "/cliente/calendario", icon: Calendar, description: "Eventos e compromissos" },
  { label: "Assistente", path: "/cliente/assistente", icon: Bot, description: "Assistente virtual" },
];

export default function ClienteDashboard() {
  const { profile } = useAuth();
  const { data: unitMemberships, isLoading: loadingUnits } = useCustomerUnit();
  const { data: receivables, isLoading: loadingReceivables } = useCustomerReceivables();
  const { data: journeyEvents } = useCustomerJourneyEvents();

  const firstName = profile?.full_name?.split(" ")[0] || "Cliente";

  if (loadingUnits || loadingReceivables) {
    return <PageSkeleton kpiCount={3} rows={4} />;
  }

  const now = new Date();
  const paid = receivables?.filter((r) => r.status === "paid") ?? [];
  const upcoming = receivables?.filter((r) => r.status === "pending" && new Date(r.due_date) >= now) ?? [];
  const overdue = receivables?.filter((r) => r.status === "pending" && new Date(r.due_date) < now) ?? [];

  const unit = unitMemberships?.[0]?.unit as any;
  const development = unit?.block?.development;

  const timelineItems = (journeyEvents ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description ?? undefined,
    date: e.event_date ? format(new Date(e.event_date), "dd MMM yyyy", { locale: ptBR }) : "",
    variant: (e.event_date && new Date(e.event_date) <= now ? "success" : "default") as "success" | "default",
  }));

  return (
    <div>
      <PageHeader
        title={`Olá, ${firstName}!`}
        description={development ? `${development.name} — Unidade ${unit?.code}` : "Bem-vindo ao seu portal."}
      />

      {/* KPI Row */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <KpiCard title="Parcelas Pagas" value={paid.length} icon={DollarSign} subtitle={`de ${(receivables?.length ?? 0)} total`} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <KpiCard title="A Vencer" value={upcoming.length} icon={Calendar} subtitle={upcoming[0] ? `Próx: ${format(new Date(upcoming[0].due_date), "dd/MM/yy")}` : "Nenhuma"} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <KpiCard
            title="Vencidas"
            value={overdue.length}
            icon={Bell}
            subtitle={overdue.length > 0 ? "Atenção!" : "Tudo em dia"}
            trend={overdue.length > 0 ? "down" : "up"}
            trendValue={overdue.length > 0 ? `${overdue.length}` : "OK"}
          />
        </motion.div>
      </div>

      {/* Journey Timeline */}
      {timelineItems.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-base font-semibold text-foreground mb-3">Jornada da Compra</h2>
          <div className="glass-card p-5 sm:p-6">
            <Timeline items={timelineItems} />
          </div>
        </div>
      )}

      {/* Quick Links */}
      <h2 className="font-display text-base font-semibold text-foreground mb-3">Acesso Rápido</h2>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {quickLinks.map((item, i) => (
          <motion.div
            key={item.path}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.04, duration: 0.3 }}
          >
            <Link to={item.path} className="glass-card p-4 sm:p-5 block hover:shadow-md transition-all group">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/8 w-fit mb-2.5 group-hover:bg-primary/12 transition-colors">
                <item.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-[13px] text-foreground mb-0.5">{item.label}</h3>
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed hidden sm:block">{item.description}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
