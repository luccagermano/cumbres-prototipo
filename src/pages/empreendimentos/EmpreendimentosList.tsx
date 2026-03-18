import { EmptyState } from "@/components/EmptyState";
import { Layers } from "lucide-react";

export default function EmpreendimentosList() {
  return (
    <div className="container py-16">
      <h1 className="font-display text-3xl font-bold text-foreground mb-8">Empreendimentos</h1>
      <EmptyState
        icon={Layers}
        title="Nenhum empreendimento cadastrado"
        description="Os empreendimentos serão exibidos aqui assim que forem publicados."
      />
    </div>
  );
}
