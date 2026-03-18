import { EmptyState } from "@/components/EmptyState";
import { Newspaper } from "lucide-react";

export default function EmpreendimentoMural() {
  return (
    <div className="container py-16">
      <h1 className="font-display text-3xl font-bold text-foreground mb-8">Mural</h1>
      <EmptyState
        icon={Newspaper}
        title="Nenhuma publicação"
        description="As novidades dos empreendimentos aparecerão aqui."
      />
    </div>
  );
}
