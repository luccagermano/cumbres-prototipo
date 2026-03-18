import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { HelpCircle } from "lucide-react";

export default function ClienteAjuda() {
  return (
    <div>
      <PageHeader title="Central de Ajuda" description="Perguntas frequentes e suporte." breadcrumb={["Portal do Cliente", "Ajuda"]} />
      <EmptyState icon={HelpCircle} title="Conteúdo em breve" description="A central de ajuda estará disponível em breve com perguntas frequentes e tutoriais." />
    </div>
  );
}
