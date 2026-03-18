import { useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { Building } from "lucide-react";

export default function EmpreendimentoDetail() {
  const { slug } = useParams();

  return (
    <div className="container py-12">
      <PageHeader
        title="Empreendimento"
        breadcrumb={["Empreendimentos", slug || "Detalhe"]}
      />
      <EmptyState
        icon={Building}
        title="Empreendimento não encontrado"
        description="O empreendimento solicitado não foi encontrado ou ainda não está disponível."
      />
    </div>
  );
}
