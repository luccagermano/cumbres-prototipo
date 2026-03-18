import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import {
  Building, Users, DollarSign, TrendingUp, Ticket, ClipboardCheck, AlertTriangle,
} from "lucide-react";
import { StatusChip } from "@/components/ui/status-chip";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function ExecutivoDashboard() {
  const { user } = useAuth();

  const { data: developments } = useQuery({
    queryKey: ["exec-developments"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("developments").select("id, name, total_units");
      return data ?? [];
    },
  });

  const { data: contracts } = useQuery({
    queryKey: ["exec-contracts"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("sales_contracts").select("id, total_contract_value, contract_status");
      return data ?? [];
    },
  });

  const { data: receivables } = useQuery({
    queryKey: ["exec-receivables"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("receivables").select("id, total_amount, status, due_date");
      return data ?? [];
    },
  });

  const { data: tickets } = useQuery({
    queryKey: ["exec-tickets"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("tickets").select("id, internal_status, priority, category_name");
      return data ?? [];
    },
  });

  const { data: inspections } = useQuery({
    queryKey: ["exec-inspections"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("inspection_bookings").select("id, booking_status");
      return data ?? [];
    },
  });

  // Compute metrics
  const totalContractValue = contracts?.reduce((s, c) => s + Number(c.total_contract_value), 0) ?? 0;
  const paidReceivables = receivables?.filter((r) => r.status === "paid") ?? [];
  const overdueReceivables = receivables?.filter((r) => r.status === "overdue") ?? [];
  const pendingReceivables = receivables?.filter((r) => r.status === "pending") ?? [];
  const totalPaid = paidReceivables.reduce((s, r) => s + Number(r.total_amount), 0);
  const totalOverdue = overdueReceivables.reduce((s, r) => s + Number(r.total_amount), 0);
  const openTickets = tickets?.filter((t) => !["resolved", "closed"].includes(t.internal_status)) ?? [];
  const scheduledInspections = inspections?.filter((i) => i.booking_status === "confirmed" || i.booking_status === "pending") ?? [];

  const inadimplenciaRate = receivables?.length
    ? ((overdueReceivables.length / receivables.length) * 100).toFixed(1)
    : "0";

  const kpis = [
    { title: "Empreendimentos", value: developments?.length ?? 0, icon: Building, subtitle: "Ativos" },
    { title: "Contratos", value: contracts?.length ?? 0, icon: Users, subtitle: `VGV: ${BRL.format(totalContractValue)}` },
    { title: "Receita Recebida", value: BRL.format(totalPaid), icon: DollarSign, subtitle: `${paidReceivables.length} parcelas pagas` },
    { title: "Inadimplência", value: `${inadimplenciaRate}%`, icon: TrendingUp, trend: overdueReceivables.length > 0 ? "down" as const : "neutral" as const, trendValue: overdueReceivables.length > 0 ? BRL.format(totalOverdue) : "—", subtitle: `${overdueReceivables.length} vencida(s)` },
    { title: "Chamados Abertos", value: openTickets.length, icon: Ticket, subtitle: `${openTickets.filter((t) => t.priority === "urgent" || t.priority === "high").length} urgente(s)` },
    { title: "Vistorias", value: scheduledInspections.length, icon: ClipboardCheck, subtitle: "Agendadas" },
  ];

  // Ticket by category for chart-like display
  const ticketByCategory: Record<string, number> = {};
  openTickets.forEach((t) => {
    ticketByCategory[t.category_name] = (ticketByCategory[t.category_name] || 0) + 1;
  });
  const topTicketCats = Object.entries(ticketByCategory).sort((a, b) => b[1] - a[1]).slice(0, 6);

  // Finance breakdown
  const financeBreakdown = [
    { label: "Pagas", value: paidReceivables.length, amount: totalPaid, variant: "success" as const },
    { label: "A vencer", value: pendingReceivables.length, amount: pendingReceivables.reduce((s, r) => s + Number(r.total_amount), 0), variant: "info" as const },
    { label: "Vencidas", value: overdueReceivables.length, amount: totalOverdue, variant: "error" as const },
  ];

  return (
    <div>
      <PageHeader title="Dashboard Executivo" description="Indicadores de performance e visão estratégica." />

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

      {/* Finance + Tickets */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="glass-card p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Resumo Financeiro</h3>
          <div className="space-y-4">
            {financeBreakdown.map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <StatusChip variant={item.variant} label={item.label} />
                  <span className="text-sm text-muted-foreground">{item.value} parcela(s)</span>
                </div>
                <span className="font-display font-semibold text-foreground">{BRL.format(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Chamados por Categoria</h3>
          {topTicketCats.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum chamado aberto.</p>
          ) : (
            <div className="space-y-3">
              {topTicketCats.map(([cat, count]) => {
                const maxCount = topTicketCats[0][1];
                const pct = Math.round((count / maxCount) * 100);
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-foreground">{cat}</span>
                      <span className="text-sm font-semibold text-primary">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Developments */}
      <div className="glass-card p-6">
        <h3 className="font-display font-semibold text-foreground mb-4">Empreendimentos</h3>
        {!developments?.length ? (
          <p className="text-sm text-muted-foreground">Nenhum empreendimento cadastrado.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {developments.map((d) => (
              <div key={d.id} className="p-4 rounded-lg border border-border">
                <p className="text-sm font-medium text-foreground">{d.name}</p>
                <p className="text-xs text-muted-foreground">{d.total_units ?? 0} unidades</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
