import { EmptyState } from "@/components/EmptyState";
import { Info } from "lucide-react";

export default function SiteAbout() {
  return (
    <div className="container py-16">
      <h1 className="font-display text-3xl font-bold text-foreground mb-8">Sobre Nós</h1>
      <EmptyState
        icon={Info}
        title="Conteúdo em breve"
        description="Estamos preparando as informações sobre a nossa história e valores."
      />
    </div>
  );
}
