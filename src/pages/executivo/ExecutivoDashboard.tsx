import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import {
  Building, Users, DollarSign, TrendingUp, Ticket, ClipboardCheck,
} from "lucide-react";

const kpis = [
  { title: "Empreendimentos", value: 0, icon: Building, trend: "neutral" as const, trendValue: "—", subtitle: "Ativos" },
  { title: "Clientes", value: 0, icon: Users, trend: "neutral" as const, trendValue: "—", subtitle: "Cadastrados" },
  { title: "Receita Mensal", value: "R$ 0", icon: DollarSign, trend: "neutral" as const, trendValue: "—", subtitle: "Mês atual" },
  { title: "Taxa de Crescimento", value: "0%", icon: TrendingUp, trend: "neutral" as const, trendValue: "—", subtitle: "vs. mês anterior" },
  { title: "Chamados Abertos", value: 0, icon: Ticket, trend: "neutral" as const, trendValue: "—", subtitle: "Pendentes" },
  { title: "Vistorias", value: 0, icon: ClipboardCheck, trend: "neutral" as const, trendValue: "—", subtitle: "Agendadas" },
];

export default function ExecutivoDashboard() {
  return (
    <div>
      <PageHeader
        title="Dashboard Executivo"
        description="Indicadores de performance e visão estratégica."
      />

      {/* KPI Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <KpiCard
              title={kpi.title}
              value={kpi.value}
              icon={kpi.icon}
              trend={kpi.trend}
              trendValue={kpi.trendValue}
              subtitle={kpi.subtitle}
            />
          </motion.div>
        ))}
      </div>

      {/* Chart placeholders */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="glass-card p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Receita por Empreendimento</h3>
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
            Gráfico disponível em breve
          </div>
        </div>
        <div className="glass-card p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Evolução de Chamados</h3>
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
            Gráfico disponível em breve
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="font-display font-semibold text-foreground mb-4">Atividade Recente</h3>
        <p className="text-sm text-muted-foreground">Nenhuma atividade registrada.</p>
      </div>
    </div>
  );
}
