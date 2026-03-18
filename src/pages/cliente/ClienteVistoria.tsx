import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { ClipboardCheck } from "lucide-react";

export default function ClienteVistoria() {
  return (
    <div>
      <PageHeader title="Vistoria" description="Agendamentos e laudos de vistoria." breadcrumb={["Portal do Cliente", "Vistoria"]} />
      <EmptyState icon={ClipboardCheck} title="Nenhuma vistoria agendada" description="Suas vistorias aparecerão aqui quando forem programadas." />
    </div>
  );
}
