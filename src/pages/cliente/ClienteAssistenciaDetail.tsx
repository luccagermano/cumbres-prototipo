import { useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { Wrench } from "lucide-react";

export default function ClienteAssistenciaDetail() {
  const { id } = useParams();

  return (
    <div>
      <PageHeader title="Assistência" breadcrumb={["Portal do Cliente", "Assistência", `#${id || ""}`]} />
      <EmptyState icon={Wrench} title="Solicitação não encontrada" description="A solicitação solicitada não foi encontrada." />
    </div>
  );
}
