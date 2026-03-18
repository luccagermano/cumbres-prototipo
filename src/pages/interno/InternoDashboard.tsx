import { motion } from "framer-motion";
import { Ticket, Shield, Calendar, FileText, DollarSign, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";

const kpis = [
  { title: "Chamados Abertos", value: 0, icon: Ticket, subtitle: "Nenhum pendente" },
  { title: "Garantias Ativas", value: 0, icon: Shield, subtitle: "Nenhuma ativa" },
  { title: "Eventos Hoje", value: 0, icon: Calendar, subtitle: "Agenda livre" },
];

const sections = [
  { label: "Chamados", path: "/interno/chamados", icon: Ticket, description: "Gestão de tickets e atendimento" },
  { label: "Garantia", path: "/interno/garantia", icon: Shield, description: "Solicitações de garantia" },
  { label: "Agenda", path: "/interno/agenda", icon: Calendar, description: "Calendário da equipe" },
  { label: "Documentos", path: "/interno/documentos", icon: FileText, description: "Documentos internos" },
  { label: "Financeiro", path: "/interno/financeiro", icon: DollarSign, description: "Relatórios financeiros" },
];

export default function InternoDashboard() {
  return (
    <div>
      <PageHeader title="Painel Interno" description="Visão geral das operações." />

      {/* KPI Row */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <KpiCard title={kpi.title} value={kpi.value} icon={kpi.icon} subtitle={kpi.subtitle} />
          </motion.div>
        ))}
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
