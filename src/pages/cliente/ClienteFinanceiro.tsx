import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { DollarSign } from "lucide-react";

export default function ClienteFinanceiro() {
  return (
    <div>
      <PageHeader title="Financeiro" description="Acompanhe boletos, parcelas e pagamentos." breadcrumb={["Portal do Cliente", "Financeiro"]} />
      <EmptyState icon={DollarSign} title="Nenhum registro financeiro" description="Seus boletos e pagamentos serão exibidos aqui." />
    </div>
  );
}
