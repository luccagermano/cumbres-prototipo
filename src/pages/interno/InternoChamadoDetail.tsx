import { useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { Ticket } from "lucide-react";

export default function InternoChamadoDetail() {
  const { id } = useParams();

  return (
    <div>
      <PageHeader title={`Chamado #${id || ""}`} breadcrumb={["Painel Interno", "Chamados", `#${id || ""}`]} />
      <EmptyState icon={Ticket} title="Chamado não encontrado" description="O chamado solicitado não foi encontrado." />
    </div>
  );
}
