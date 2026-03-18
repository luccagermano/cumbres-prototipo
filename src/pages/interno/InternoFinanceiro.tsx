import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { DollarSign } from "lucide-react";

export default function InternoFinanceiro() {
  return (
    <div>
      <PageHeader title="Financeiro" description="Relatórios e dados financeiros." breadcrumb={["Painel Interno", "Financeiro"]} />
      <EmptyState icon={DollarSign} title="Nenhum registro financeiro" description="Os dados financeiros aparecerão aqui." />
    </div>
  );
}
