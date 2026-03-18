import { useParams } from "react-router-dom";
import { EmptyState } from "@/components/EmptyState";
import { Megaphone } from "lucide-react";

export default function CampanhaDetail() {
  const { slug } = useParams();

  return (
    <div className="container py-16">
      <h1 className="font-display text-3xl font-bold text-foreground mb-8">Campanha</h1>
      <EmptyState
        icon={Megaphone}
        title="Campanha não encontrada"
        description={`A campanha "${slug}" não foi encontrada ou já encerrou.`}
      />
    </div>
  );
}
