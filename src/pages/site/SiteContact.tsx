import { EmptyState } from "@/components/EmptyState";
import { Phone } from "lucide-react";

export default function SiteContact() {
  return (
    <div className="container py-16">
      <h1 className="font-display text-3xl font-bold text-foreground mb-8">Contato</h1>
      <EmptyState
        icon={Phone}
        title="Formulário em breve"
        description="Em breve você poderá enviar sua mensagem diretamente por aqui."
      />
    </div>
  );
}
