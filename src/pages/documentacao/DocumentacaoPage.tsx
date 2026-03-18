import { EmptyState } from "@/components/EmptyState";
import { BookOpen } from "lucide-react";

export default function DocumentacaoPage() {
  return (
    <div className="container py-16">
      <h1 className="font-display text-3xl font-bold text-foreground mb-8">Documentação</h1>
      <EmptyState
        icon={BookOpen}
        title="Documentação em breve"
        description="A documentação do sistema estará disponível aqui."
      />
    </div>
  );
}
