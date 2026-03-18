import { useParams } from "react-router-dom";
import { EmptyState } from "@/components/EmptyState";
import { Building } from "lucide-react";

export default function EmpreendimentoDetail() {
  const { slug } = useParams();

  return (
    <div className="container py-16">
      <h1 className="font-display text-3xl font-bold text-foreground mb-8">Empreendimento</h1>
      <EmptyState
        icon={Building}
        title="Empreendimento não encontrado"
        description={`O empreendimento "${slug}" não foi encontrado ou ainda não está disponível.`}
      />
    </div>
  );
}
