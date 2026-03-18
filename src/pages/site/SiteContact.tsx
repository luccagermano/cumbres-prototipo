import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { Phone } from "lucide-react";

export default function SiteContact() {
  return (
    <div className="container py-12">
      <PageHeader
        title="Contato"
        description="Envie uma mensagem ou encontre nossos canais de atendimento."
        breadcrumb={["Site", "Contato"]}
      />
      <EmptyState
        icon={Phone}
        title="Formulário em breve"
        description="Em breve você poderá enviar sua mensagem diretamente por aqui."
      />
    </div>
  );
}
