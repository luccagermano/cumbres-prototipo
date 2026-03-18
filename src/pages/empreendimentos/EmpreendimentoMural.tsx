import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { Newspaper } from "lucide-react";

export default function EmpreendimentoMural() {
  return (
    <div className="container py-12">
      <PageHeader
        title="Mural de Novidades"
        description="Acompanhe as atualizações dos empreendimentos."
        breadcrumb={["Empreendimentos", "Mural"]}
      />
      <EmptyState
        icon={Newspaper}
        title="Nenhuma publicação"
        description="As novidades e atualizações dos empreendimentos aparecerão aqui."
      />
    </div>
  );
}
