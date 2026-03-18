import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { Zap } from "lucide-react";

export default function ExecutivoAutomacao() {
  return (
    <div>
      <PageHeader title="Automação" description="Configure fluxos automatizados e integrações." breadcrumb={["Executivo", "Automação"]} />
      <EmptyState icon={Zap} title="Nenhuma automação configurada" description="As automações e fluxos automatizados serão gerenciados aqui." />
    </div>
  );
}
