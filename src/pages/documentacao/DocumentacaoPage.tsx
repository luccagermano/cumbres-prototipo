import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { BookOpen } from "lucide-react";
import { GlobalAreaSwitcher } from "@/components/GlobalAreaSwitcher";

export default function DocumentacaoPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <GlobalAreaSwitcher />
      <div className="flex-1 pt-11">
        <div className="container py-12">
          <PageHeader
            title="Documentação"
            description="Guias, referências e documentação técnica da plataforma."
            breadcrumb={["Documentação"]}
          />
          <EmptyState
            icon={BookOpen}
            title="Documentação em breve"
            description="A documentação completa da plataforma estará disponível aqui."
          />
        </div>
      </div>
    </div>
  );
}
