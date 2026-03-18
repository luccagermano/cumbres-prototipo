import { useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { Megaphone } from "lucide-react";

export default function CampanhaDetail() {
  const { slug } = useParams();

  return (
    <div className="container py-12">
      <PageHeader
        title="Campanha"
        breadcrumb={["Campanhas", slug || "Detalhe"]}
      />
      <EmptyState
        icon={Megaphone}
        title="Campanha não encontrada"
        description="A campanha solicitada não foi encontrada ou já encerrou."
      />
    </div>
  );
}
