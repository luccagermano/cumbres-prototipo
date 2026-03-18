import { useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { FileText } from "lucide-react";

export default function ClienteDocumentoDetail() {
  const { id } = useParams();

  return (
    <div>
      <PageHeader title="Documento" breadcrumb={["Portal do Cliente", "Documentos", id || "Detalhe"]} />
      <EmptyState icon={FileText} title="Documento não encontrado" description="O documento solicitado não foi encontrado." />
    </div>
  );
}
