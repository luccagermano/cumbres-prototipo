import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { ChipFilter } from "@/components/ui/chip-filter";
import { StatusChip } from "@/components/ui/status-chip";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { DollarSign, Calendar, AlertTriangle, CreditCard, FileText } from "lucide-react";
import { useCustomerReceivables, useCustomerContracts } from "@/hooks/useCustomerData";
import { format } from "date-fns";
import { motion } from "framer-motion";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const filterOptions = [
  { label: "Todas", value: "all" },
  { label: "Pagas", value: "paid" },
  { label: "A vencer", value: "pending" },
  { label: "Vencidas", value: "overdue" },
];

export default function ClienteFinanceiro() {
  const { data: receivables, isLoading } = useCustomerReceivables();
  const { data: contracts } = useCustomerContracts();
  const [filters, setFilters] = useState<string[]>(["all"]);

  const now = new Date();
  const contract = contracts?.[0];

  const categorized = useMemo(() => {
    const all = receivables ?? [];
    const paid = all.filter((r) => r.status === "paid");
    const pending = all.filter((r) => r.status === "pending" && new Date(r.due_date) >= now);
    const overdue = all.filter((r) => r.status === "pending" && new Date(r.due_date) < now);
    return { all, paid, pending, overdue };
  }, [receivables]);

  const paidTotal = categorized.paid.reduce((s, r) => s + Number(r.total_amount), 0);
  const pendingTotal = categorized.pending.reduce((s, r) => s + Number(r.total_amount), 0);
  const overdueTotal = categorized.overdue.reduce((s, r) => s + Number(r.total_amount), 0);

  const filtered = useMemo(() => {
    if (filters.includes("all") || filters.length === 0) return categorized.all;
    let result: typeof categorized.all = [];
    if (filters.includes("paid")) result = [...result, ...categorized.paid];
    if (filters.includes("pending")) result = [...result, ...categorized.pending];
    if (filters.includes("overdue")) result = [...result, ...categorized.overdue];
    return result.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  }, [filters, categorized]);

  return (
    <div>
      <PageHeader
        title="Financeiro"
        description="Acompanhe boletos, parcelas e pagamentos."
        breadcrumb={["Portal do Cliente", "Financeiro"]}
      />

      {/* Contract Badge */}
      {contract && (
        <div className="glass-card p-4 mb-6 flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">Contrato {contract.contract_number}</span>
          </div>
          <StatusChip label={contract.contract_status} variant="info" />
          {contract.bank_name && (
            <span className="text-muted-foreground">
              Financiamento: <span className="font-medium text-foreground">{contract.bank_name}</span>
            </span>
          )}
          {contract.financing_status && <StatusChip status={contract.financing_status} />}
          <span className="text-muted-foreground ml-auto">
            Valor total: <span className="font-semibold text-foreground">{BRL.format(Number(contract.total_contract_value))}</span>
          </span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-4 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <KpiCard title="Total Pago" value={BRL.format(paidTotal)} icon={DollarSign} subtitle={`${categorized.paid.length} parcela(s)`} trend="up" trendValue={`${categorized.paid.length}`} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
          <KpiCard title="A Vencer" value={BRL.format(pendingTotal)} icon={Calendar} subtitle={`${categorized.pending.length} parcela(s)`} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <KpiCard title="Vencidas" value={BRL.format(overdueTotal)} icon={AlertTriangle} subtitle={categorized.overdue.length > 0 ? "Atenção!" : "Nenhuma"} trend={categorized.overdue.length > 0 ? "down" : "neutral"} trendValue={`${categorized.overdue.length}`} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <KpiCard
            title="Saldo do Contrato"
            value={BRL.format(pendingTotal + overdueTotal)}
            icon={CreditCard}
            subtitle="Restante a pagar"
          />
        </motion.div>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <ChipFilter
          options={filterOptions.map((f) => ({
            ...f,
            count: f.value === "all" ? categorized.all.length
              : f.value === "paid" ? categorized.paid.length
              : f.value === "pending" ? categorized.pending.length
              : categorized.overdue.length,
          }))}
          selected={filters}
          onChange={(sel) => setFilters(sel.length === 0 ? ["all"] : sel.filter((s) => s !== "all" || sel.length === 1))}
        />
      </div>

      {/* Installments List */}
      {isLoading ? (
        <div className="glass-card p-12 text-center text-muted-foreground text-sm">Carregando parcelas...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={DollarSign} title="Nenhuma parcela encontrada" description="Seus boletos e pagamentos serão exibidos aqui." />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Parcela</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vencimento</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pago em</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const isOverdue = r.status === "pending" && new Date(r.due_date) < now;
                  return (
                    <tr key={r.id} className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{r.title}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{format(new Date(r.due_date), "dd/MM/yyyy")}</td>
                      <td className="px-4 py-3 text-sm text-foreground text-right font-medium">{BRL.format(Number(r.total_amount))}</td>
                      <td className="px-4 py-3 text-center">
                        <StatusChip status={isOverdue ? "overdue" : r.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {r.paid_at ? format(new Date(r.paid_at), "dd/MM/yyyy") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
