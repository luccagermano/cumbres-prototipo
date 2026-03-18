import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { Info } from "lucide-react";

export default function SiteAbout() {
  return (
    <div className="container py-12">
      <PageHeader
        title="Sobre Nós"
        description="Conheça a história, missão e valores da nossa construtora."
        breadcrumb={["Site", "Sobre"]}
      />
      <EmptyState
        icon={Info}
        title="Conteúdo em preparação"
        description="Estamos preparando as informações sobre a nossa história, missão e valores. Volte em breve."
      />
    </div>
  );
}
