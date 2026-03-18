import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { Building } from "lucide-react";

export default function ClienteUnidade() {
  return (
    <div>
      <PageHeader title="Minha Unidade" description="Informações da sua unidade." breadcrumb={["Portal do Cliente", "Minha Unidade"]} />
      <EmptyState icon={Building} title="Nenhuma unidade vinculada" description="Sua unidade aparecerá aqui quando estiver cadastrada no sistema." />
    </div>
  );
}
